// =====================================================================
// 本番素材のコピー (09_assets)。ユーザが用意した立ち絵 / SD を本番の命名規約で assets/ にコピーする。
//   node tools/art_sync.js          … コピー (既存は上書き)
//   node tools/art_sync.js --dry    … 何をコピーするかだけ表示
// 出所は環境変数 GRIMOIRE_ART_DIR (既定 C:\Users\jyll\OneDrive\tale)。出所の記録は assets/ART_SOURCES.md
//   <src>/1/{base,wing}.png, <n>.png            → characters/1/stand/{base,wing}.png, face/<n>.png
//   <src>/sd/{base,wing}.png, <n>.png           → characters/1/sd/{base,wing}.png, face/<n>.png
//   <src>/sd/{half,full}.png                    → characters/1/sd/costume_<key>.png
//   <src>/sd/special1.png                       → characters/1/sd/unique_ds_crystal.png (結晶化の SD。本番。足元が結晶に包まれた全身差分)
//   <src>/sd/special2.png                       → characters/1/sd/unique_ds_fever.png (体温上昇の SD。本番)
//   <src>/sd/{poison,sleep,paralyze}.png        → characters/1/sd/status_<key>.png
//   <src>/sd/heart.png / nebaneba.png           → characters/1/sd/status_arousal.png / status_sticky.png
//   みずぎ (costume_special1) の仮: base のコピー (素材が届いたら <src>/sd/swimsuit.png → costume_special1.png)
// 白フチ (outline_*) は tools/sd_outline.py (M3 で移植) が生成する
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.GRIMOIRE_ART_DIR || "C:\\Users\\jyll\\OneDrive\\tale";
const OUT = path.join(ROOT, "src/renderer/public/assets");
const dry = process.argv.includes("--dry");

const PLAN = [];
const add = (from, to, note = "") => PLAN.push({ from, to, note });

// 立ち絵
{
  const dir = path.join(SRC, "1");
  for (const f of fs.readdirSync(dir)) {
    if (f === "wing.png" || f === "base.png") add(`1/${f}`, `characters/1/stand/${f}`, "立ち絵");
    else if (/^\d+\.png$/.test(f)) add(`1/${f}`, `characters/1/stand/face/${f}`, "表情");
  }
}

// SD
{
  const dir = path.join(SRC, "sd");
  const statusKey = { poison: "poison", sleep: "sleep", paralyze: "paralyze", heart: "arousal", nebaneba: "sticky" };
  const costumeKey = ["half", "full"];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const stem = f.replace(/\.png$/, "");
    if (f === "wing.png" || f === "base.png") add(`sd/${f}`, `characters/1/sd/${f}`, "SD");
    else if (/^\d+\.png$/.test(f)) add(`sd/${f}`, `characters/1/sd/face/${f}`, "SD 表情");
    else if (statusKey[stem]) add(`sd/${f}`, `characters/1/sd/status_${statusKey[stem]}.png`, `共通バステ (元の名前 ${stem})`);
    else if (costumeKey.includes(stem)) add(`sd/${f}`, `characters/1/sd/costume_${stem}.png`, "衣装");
    else if (stem === "swimsuit") add(`sd/${f}`, `characters/1/sd/costume_special1.png`, "衣装 みずぎ (元の名前 swimsuit)");
    else if (stem === "special1") add(`sd/${f}`, `characters/1/sd/unique_ds_crystal.png`, "固有バステ 結晶化 (本番。元の名前 special1)");
    else if (stem === "special2") add(`sd/${f}`, `characters/1/sd/unique_ds_fever.png`, "固有バステ 体温上昇 (本番。元の名前 special2)");
    else console.warn(`対応の無い SD ファイル: sd/${f}`);
  }
  if (!files.includes("swimsuit.png"))
    add("sd/base.png", "characters/1/sd/costume_special1.png", "衣装 みずぎ の仮 (base のコピー = 通常衣装のまま。素材未着)");
}

let copied = 0;
for (const { from, to } of PLAN) {
  const src = path.join(SRC, from);
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
    "# 本番素材の出所 (生成物)",
    "",
    "`node tools/art_sync.js` がユーザの素材フォルダ (既定 `C:\\Users\\jyll\\OneDrive\\tale`) からコピーして書く。プレースホルダの出所は PLACEHOLDERS.md。",
    "",
    "| assets/ | 出所 | 備考 |",
    "|---|---|---|",
    ...PLAN.map(({ from, to, note }) => `| ${to} | ${from} | ${note} |`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "ART_SOURCES.md"), md, "utf8");
  console.log(`コピー ${copied} 件 → ${OUT} (ART_SOURCES.md を更新)`);
}
