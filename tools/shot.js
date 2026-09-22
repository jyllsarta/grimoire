#!/usr/bin/env node
// 見た目確認・UI 通しテスト用の headless Chrome ランナー (tale から移植。08_verification)
//
//   node tools/shot.js ingame battle                → tmp/shots/<hash>.png (dev サーバの #<hash> を撮る)
//   node tools/shot.js --url http://localhost:5173 ingame   → dev サーバの URL 指定 (既定は VITE_DEV_URL か http://localhost:5173)
//   node tools/shot.js --out tmp/x --prefix new_ ingame
//   node tools/shot.js --size 1296x815 intermission → ウィンドウ外寸 (既定 1296x815 ≒ 内寸 1280x720)
//   node tools/shot.js --budget 8000 intermission   → virtual-time-budget (ms、既定 6000)
//   node tools/shot.js --scale 2 inv                → 2 倍解像度
//   node tools/shot.js --autotest                   → #autotest を dump-dom で走らせ AUTOTEST_RESULT を表示 (exit 1 = エラーあり)
//
// Chrome の場所は環境変数 CHROME で上書きできる。dev サーバは `npm run dev` (electron-vite が renderer を 5173 で配る) を先に起動しておく
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const opt = {
  out: path.join(ROOT, "tmp", "shots"),
  prefix: "",
  size: "1296,815",
  budget: "6000",
  autotest: false,
  scale: "1",
  url: process.env.VITE_DEV_URL || "http://localhost:5173/",
};
const hashes = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") opt.out = path.resolve(args[++i]);
  else if (a === "--prefix") opt.prefix = args[++i];
  else if (a === "--size") opt.size = args[++i].replace("x", ",");
  else if (a === "--budget") opt.budget = args[++i];
  else if (a === "--autotest") opt.autotest = true;
  else if (a === "--scale") opt.scale = args[++i];
  else if (a === "--url") opt.url = args[++i];
  else hashes.push(a.replace(/^#/, ""));
}

function chrome(extra, hash) {
  return execFileSync(
    CHROME,
    ["--headless=new", `--window-size=${opt.size}`, "--hide-scrollbars", `--force-device-scale-factor=${opt.scale}`, ...extra, `${opt.url}#${hash}`],
    { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 300000 },
  ).toString();
}

if (opt.autotest) {
  const dom = chrome(["--virtual-time-budget=120000", "--dump-dom"], "autotest");
  const m = dom.match(/AUTOTEST_RESULT[^<]{0,2000}/);
  if (!m) {
    console.log("AUTOTEST_RESULT が見つからない (DOM " + dom.length + " bytes)");
    process.exit(1);
  }
  console.log(m[0]);
  try {
    const r = JSON.parse(m[0].replace(/^AUTOTEST_RESULT\s*/, ""));
    process.exit(r.errors && r.errors.length ? 1 : 0);
  } catch (e) {
    process.exit(0);
  }
}

if (!hashes.length) {
  console.log("usage: node tools/shot.js [--url URL] [--out DIR] [--prefix P] [--size WxH] [--budget MS] [--scale N] hash... | --autotest");
  process.exit(2);
}
fs.mkdirSync(opt.out, { recursive: true });
for (const h of hashes) {
  const file = path.join(opt.out, `${opt.prefix}${h}.png`);
  chrome([`--virtual-time-budget=${opt.budget}`, `--screenshot=${file}`], h);
  console.log(file);
}
