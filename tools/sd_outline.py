# =====================================================================
# SD の駒の白フチ生成 (09_assets。tale/tools/sd_outline.py の移植)
#   assets/characters/<id>/sd/ の wing.png + 衣装レイヤーのシルエットを距離変換で円形に膨張させ、
#   白い outline_<layer>.png を作る (SdPiece.vue が最背面に重ねる)。
#   レイヤー: base → outline_normal.png / costume_<key>.png → outline_<key>.png / unique_<key>.png → outline_<key>.png
#   角が自然に丸くなるよう、正方カーネルではなくユークリッド距離で膨張する。
#   素材が画面端ぎりぎりまで描かれていても白フチが切れないよう、出力は元素材より PAD_RATIO (1/32) ずつ四方に広い
#   キャンバスに描く (2048px 素材なら 64px ずつ)。SdPiece.vue が同じ比率 (app/ui/sd.js の SD_OUTLINE_PAD) だけはみ出して重ねる。
#
#   python tools/sd_outline.py            … 全キャラ (assets/characters/*/sd に base.png があるもの)
#   python tools/sd_outline.py --radius 52
#
#   依存: pip install pillow numpy scipy
# =====================================================================
import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "renderer", "public", "assets", "characters")
PAD_RATIO = 32  # 四方の余白 = 素材の幅 / 32 (app/ui/sd.js の SD_OUTLINE_PAD と揃える)


def build_outline(dir_path, radius, layer_name):
    layers = [f for f in ("wing.png", "base.png", layer_name) if os.path.exists(os.path.join(dir_path, f))]
    if "base.png" not in layers:
        return None
    alpha = None
    for f in dict.fromkeys(layers):
        a = np.asarray(Image.open(os.path.join(dir_path, f)).convert("RGBA"))[:, :, 3].astype(np.float32) / 255.0
        alpha = a if alpha is None else np.maximum(alpha, a)
    # 端まで描かれた素材でも膨張が切れないよう、余白を足したキャンバスで距離変換する
    pad = alpha.shape[1] // PAD_RATIO
    if radius > pad:
        raise SystemExit(f"--radius {radius} が余白 {pad}px より大きい (PAD_RATIO を下げるか radius を小さく)")
    alpha = np.pad(alpha, pad)
    # 半透明の縁も含めてシルエットとみなす
    solid = alpha >= 0.25
    # 透明側の各画素から、いちばん近い不透明画素までの距離
    dist = ndimage.distance_transform_edt(~solid)
    # radius までを白、境界 1px をなだらかに
    out_alpha = np.clip(radius + 0.5 - dist, 0.0, 1.0)
    out_alpha = np.maximum(out_alpha, alpha)  # 元の半透明部分も白で下支え
    h, w = out_alpha.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = 255
    rgba[:, :, 3] = (out_alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--radius", type=int, default=52, help="膨張半径 (px、2048px 素材基準)")
    args = ap.parse_args()
    for name in sorted(os.listdir(ROOT)):
        d = os.path.join(ROOT, name, "sd")
        if not os.path.isdir(d) or not os.path.exists(os.path.join(d, "base.png")):
            continue
        # 通常衣装
        img = build_outline(d, args.radius, "base.png")
        img.save(os.path.join(d, "outline_normal.png"), optimize=True)
        print(f"{name}: outline_normal.png ({args.radius}px)")
        # 衣装差分 / 固有バステの差分はシルエットが違うので、それぞれ outline_<key>.png を作る
        for f in sorted(os.listdir(d)):
            for prefix in ("costume_", "unique_"):
                if f.startswith(prefix) and f.endswith(".png"):
                    key = f[len(prefix):-4]
                    if key == "normal":
                        continue
                    img = build_outline(d, args.radius, f)
                    img.save(os.path.join(d, f"outline_{key}.png"), optimize=True)
                    print(f"{name}: outline_{key}.png")


if __name__ == "__main__":
    sys.exit(main())
