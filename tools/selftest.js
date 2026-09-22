// =====================================================================
// selftest (08): レジストリ駆動のマスタ検証 + ボット N ラン (勝率は参考値)。import.js の後に自動で回る。
//   node tools/selftest.js            … base profile で検証 + 30 ラン
//   node tools/selftest.js --runs 200
//   node tools/selftest.js --profile trial
//   node tools/selftest.js --quiet    … 問題の一覧だけ
// 通らなくても起動はする (問題は console に並べる)。CI では失敗扱い。
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { ROOT, buildTablesFromCsv } from "./lib.js";
import { loadMaster } from "../src/renderer/src/core/master/index.js";
import { validateMaster, formatProblems } from "../src/renderer/src/core/master/validate.js";
import { runGame } from "../test/harness/run_game.js";
import { heroines, booksOf } from "../src/renderer/src/core/queries/index.js";

const args = process.argv.slice(2);
const flagValue = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const profile = flagValue("--profile", "base");
const runs = Number(flagValue("--runs", "30"));

// app が使う T("key") を静的に集める (三項演算子でキーを組まない前提)
function scanTextKeys() {
  const keys = new Set();
  const dir = path.join(ROOT, "src/renderer/src/app");
  if (!fs.existsSync(dir)) return [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(js|vue)$/.test(f)) {
        const src = fs.readFileSync(p, "utf8");
        for (const m of src.matchAll(/\bT\(\s*"([^"]+)"/g)) keys.add(m[1]);
      }
    }
  };
  walk(dir);
  return [...keys];
}

const tables = buildTablesFromCsv(profile);
const problems = validateMaster(tables, { requiredTextKeys: scanTextKeys() });
const errors = problems.filter((p) => p.level === "error");
console.log(`[selftest] profile=${profile} マスタ検証: ${problems.length} 件 (error ${errors.length})`);
for (const line of formatProblems(problems)) console.log("  " + line);

let botFailed = false;
if (errors.length === 0) {
  loadMaster(tables);
  const stats = [];
  for (const heroine of heroines()) {
    for (const book of booksOf(heroine.id)) {
      let wins = 0,
        happy = 0,
        losses = 0,
        bad = 0;
      for (let seed = 1; seed <= runs; seed++) {
        const r = runGame({ characterId: heroine.id, bookId: book.id, seed, checkInvariants: true });
        if (!r.ok) {
          bad += 1;
          if (bad <= 3) {
            console.log(`  NG seed=${seed} character=${heroine.id} book=${book.id}: ${r.explain}`);
          }
        }
        if (r.result?.ending === "normal") wins += 1;
        if (r.result?.ending === "happy") happy += 1;
        if (r.result?.ending === "lose") losses += 1;
      }
      stats.push(`  ${heroine.name} × ${book.name}: normal ${wins} / happy ${happy} / lose ${losses} / NG ${bad} (${runs} ラン)`);
      if (bad > 0) botFailed = true;
    }
  }
  console.log("[selftest] ボット (勝率は参考値):");
  for (const s of stats) console.log(s);
}

if (errors.length > 0 || botFailed) {
  console.log("[selftest] 失敗");
  process.exit(1);
}
console.log("[selftest] OK");
