# =====================================================================
# スターパレット背景用「立ち絵の輪郭の星座」生成 (tale/tools/star_outline.py の移植)
#   assets/characters/<id>/stand/ の wing.png + base.png + face/1.png を重ねた絵のシルエットの境界を
#   ポリラインとして抜き出し、要所に星 (四光芒) を置いて assets/star/outlines.json に書く。
#   StarPaletteScene.vue が fetch してインライン SVG で描くので、線は常に 1px。実行時には画像処理しない。
#
#   python tools/star_outline.py              … 全キャラ (assets/characters/*/stand に base.png があるもの)
#   python tools/star_outline.py --eps 1.5    … 折れ線の簡略化の許容誤差 (元画像の px。大きいほど頂点が減る)
#   python tools/star_outline.py --no-stars   … 星なし (輪郭だけ)
#   python tools/star_outline.py --png        … 確認用に tmp/star_outline_<id>.png も書く
#
#   出力座標は 800x1200 (元の 1600x2400 の 1/2)。
#   依存: pip install pillow numpy scipy
# =====================================================================
import argparse
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CHAR_DIR = os.path.join(ROOT, "src", "renderer", "public", "assets", "characters")
OUT_DIR = os.path.join(ROOT, "src", "renderer", "public", "assets", "star")
OUT_W, OUT_H = 800, 1200


def load_stack(dir_path):
    """wing → base → 表情 1 を重ねた RGBA"""
    img = None
    for f in ("wing.png", "base.png", os.path.join("face", "1.png")):
        p = os.path.join(dir_path, f)
        if not os.path.exists(p):
            continue
        layer = Image.open(p).convert("RGBA")
        img = layer if img is None else Image.alpha_composite(img, layer)
    return img


def silhouette_mask(img):
    alpha = np.asarray(img)[:, :, 3]
    solid = alpha >= 128
    # 1px の穴や飛び地を整える
    solid = ndimage.binary_closing(solid, iterations=1)
    solid = ndimage.binary_opening(solid, iterations=1)
    return solid


def trace_loops(solid):
    """シルエットの境界を閉じた折れ線 (画素の角の座標) の列にする。塗りを右手に見る向きで辿る"""
    pad = np.pad(solid, 1)
    s = pad[1:-1, 1:-1]
    up = pad[:-2, 1:-1]
    down = pad[2:, 1:-1]
    left = pad[1:-1, :-2]
    right = pad[1:-1, 2:]
    edges = {}  # start(x,y) → [end(x,y), ...]

    def add(mask, sx, sy, ex, ey):
        ys, xs = np.nonzero(mask)
        for x, y in zip(xs.tolist(), ys.tolist()):
            edges.setdefault((x + sx, y + sy), []).append((x + ex, y + ey))

    add(s & ~up, 0, 0, 1, 0)  # 上辺: 左→右
    add(s & ~right, 1, 0, 1, 1)  # 右辺: 上→下
    add(s & ~down, 1, 1, 0, 1)  # 下辺: 右→左
    add(s & ~left, 0, 1, 0, 0)  # 左辺: 下→上
    loops = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = start
        while True:
            nxt_list = edges.get(cur)
            if not nxt_list:
                break
            nxt = nxt_list.pop()
            if not nxt_list:
                del edges[cur]
            if nxt == start:
                break
            loop.append(nxt)
            cur = nxt
        if len(loop) >= 3:
            loops.append(loop)
    return loops


def simplify(points, eps):
    """Douglas-Peucker (閉ループは最遠点で 2 分割してから)"""
    pts = np.asarray(points, dtype=np.float64)
    if len(pts) < 4:
        return pts

    def dp(p):
        if len(p) < 3:
            return p
        a, b = p[0], p[-1]
        ab = b - a
        n = np.hypot(*ab)
        if n == 0:
            d = np.hypot(*(p - a).T)
        else:
            q = p - a
            d = np.abs(ab[0] * q[:, 1] - ab[1] * q[:, 0]) / n
        i = int(np.argmax(d))
        if d[i] > eps:
            return np.vstack([dp(p[: i + 1])[:-1], dp(p[i:])])
        return np.vstack([a, b])

    far = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
    first = dp(pts[: far + 1])
    second = dp(np.vstack([pts[far:], pts[:1]]))
    return np.vstack([first[:-1], second[:-1]])


def turning_angles(loop):
    p = np.asarray(loop)
    prev = np.roll(p, 1, axis=0)
    nxt = np.roll(p, -1, axis=0)
    v1 = p - prev
    v2 = nxt - p
    a1 = np.arctan2(v1[:, 1], v1[:, 0])
    a2 = np.arctan2(v2[:, 1], v2[:, 0])
    return np.abs((a2 - a1 + math.pi) % (2 * math.pi) - math.pi)


def pick_star_points(loops, count, min_dist, seed=7):
    """折れ線の頂点から、角がきつい所を優先しつつ互いに min_dist 以上離して count 個えらぶ"""
    cands = []
    for loop in loops:
        ang = turning_angles(loop)
        for (x, y), a in zip(loop, ang):
            cands.append((a, float(x), float(y)))
    rng = np.random.default_rng(seed)
    cands.sort(key=lambda c: -(c[0] + rng.random() * 0.6))
    chosen = []
    for _, x, y in cands:
        if all((x - cx) ** 2 + (y - cy) ** 2 >= min_dist**2 for cx, cy in chosen):
            chosen.append((x, y))
            if len(chosen) >= count:
                break
    return chosen


def build(dir_path, eps, with_stars):
    img = load_stack(dir_path)
    if img is None:
        return None
    sx, sy = OUT_W / img.size[0], OUT_H / img.size[1]
    solid = silhouette_mask(img)
    loops = []
    for loop in trace_loops(solid):
        pts = np.asarray(loop, dtype=np.float64)
        if (pts.max(axis=0) - pts.min(axis=0)).max() < 12:
            continue  # ゴミ
        loops.append(simplify(pts, eps) * np.array([sx, sy]))
    stars = pick_star_points(loops, count=48, min_dist=70) if with_stars else []
    return {"w": OUT_W, "h": OUT_H, "loops": loops, "stars": stars}


def path_d(loop):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in loop) + " Z"


def preview_png(data, out):
    im = Image.new("RGBA", (data["w"], data["h"]), (16, 18, 32, 255))
    draw = ImageDraw.Draw(im)
    for loop in data["loops"]:
        pts = [tuple(p) for p in loop] + [tuple(loop[0])]
        draw.line(pts, fill=(255, 255, 255, 230), width=1)
    for x, y in data["stars"]:
        draw.line([(x - 5, y), (x + 5, y)], fill=(255, 250, 240, 255), width=1)
        draw.line([(x, y - 5), (x, y + 5)], fill=(255, 250, 240, 255), width=1)
    im.convert("RGB").save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--eps", type=float, default=1.5, help="折れ線の簡略化の許容誤差 (元画像 px)")
    ap.add_argument("--no-stars", action="store_true")
    ap.add_argument("--png", action="store_true", help="確認用 PNG を tmp/ に書く")
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    out = {}
    for name in sorted(os.listdir(CHAR_DIR)):
        d = os.path.join(CHAR_DIR, name, "stand")
        if not os.path.isdir(d) or not os.path.exists(os.path.join(d, "base.png")):
            continue
        data = build(d, args.eps, not args.no_stars)
        out[name] = {
            "w": data["w"],
            "h": data["h"],
            "paths": [path_d(loop) for loop in data["loops"]],
            "stars": [[round(x, 1), round(y, 1)] for x, y in data["stars"]],
        }
        npts = sum(len(l) for l in data["loops"])
        print(f"{name}: loops={len(data['loops'])} points={npts} stars={len(data['stars'])}")
        if args.png:
            tmp = os.path.join(ROOT, "tmp")
            os.makedirs(tmp, exist_ok=True)
            preview_png(data, os.path.join(tmp, f"star_outline_{name}.png"))
    with open(os.path.join(OUT_DIR, "outlines.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("→ assets/star/outlines.json")


if __name__ == "__main__":
    sys.exit(main())
