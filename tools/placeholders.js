// =====================================================================
// プレースホルダ素材のコピー (09_assets)。tale / xqueens の素材を本番の命名規約でコピーし、出所を assets/PLACEHOLDERS.md に記録する。
// 差し替えは同名ファイルの上書きだけ (コード変更なし)。
// デスサイズちゃん (1) の立ち絵と SD は本番素材が届いたので対象外 (tools/art_sync.js)。
//   node tools/placeholders.js          … コピー (既存は上書き)
//   node tools/placeholders.js --dry    … 何をコピーするかだけ表示
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TALE = process.env.TALE_DIR || path.resolve(ROOT, "../librarian/tale");
const OUT = path.join(ROOT, "src/renderer/public/assets");
const dry = process.argv.includes("--dry");

// [出所 (tale/assets からの相対), 先 (assets/ からの相対), 備考]
const PLAN = [];
const add = (from, to, note = "") => PLAN.push({ from, to, note });

// 立ち絵: トリシー (12) → オラクルちゃん (0)
{
  const dir = path.join(TALE, "assets/character/12");
  for (const f of fs.readdirSync(dir)) {
    if (f === "wing.png" || f === "base.png") add(`character/12/${f}`, `characters/0/stand/${f}`, "立ち絵");
    else if (/^\d+\.png$/.test(f)) add(`character/12/${f}`, `characters/0/stand/face/${f}`, "表情");
  }
}

// 同名ディレクトリ
for (const dir of ["icons", "backgrounds", "sounds", "fonts", "frames", "etc", "star"]) {
  const base = path.join(TALE, "assets", dir);
  if (!fs.existsSync(base)) continue;
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else {
        const rel = path.relative(path.join(TALE, "assets"), p).split(path.sep).join("/");
        add(rel, rel, dir);
      }
    }
  };
  walk(base);
}

let copied = 0;
for (const { from, to } of PLAN) {
  const src = path.join(TALE, "assets", from);
  const dst = path.join(OUT, to);
  if (!fs.existsSync(src)) {
    console.warn(`無い: ${src}`);
    continue;
  }
  if (dry) {
    console.log(`${from} → assets/${to}`);
    continue;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  copied += 1;
}

if (!dry) {
  const md = [
    "# プレースホルダ素材の出所 (生成物)",
    "",
    "`node tools/placeholders.js` が tale の素材をコピーして書く。本番素材は同名ファイルの上書きで差し替える (コード変更なし)。",
    "デスサイズちゃん (characters/1) の立ち絵と SD は本番素材 (`tools/art_sync.js`、出所は ART_SOURCES.md)。",
    "",
    "| assets/ | 出所 (librarian/tale/assets/) | 備考 |",
    "|---|---|---|",
    ...PLAN.map(({ from, to, note }) => `| ${to} | ${from} | ${note} |`),
    "",
  ].join("\n");
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "PLACEHOLDERS.md"), md, "utf8");
  console.log(`コピー ${copied} 件 → ${OUT} (PLACEHOLDERS.md を更新)`);
}
