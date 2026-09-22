// =====================================================================
// スプレッドシート / CSV → src/renderer/src/masterdata/<profile>/*.js 生成 (全 profile ぶん) + selftest
//
//   node tools/import.js                 data/sheet_id.txt があればシートから取得 (Sheets API)、なければ data/*.csv から生成
//   node tools/import.js --local         シートを見ずに data/*.csv から生成
//   node tools/import.js --sheet <ID>    シート ID を記憶して取得
//   node tools/import.js --gviz          Sheets API ではなく gviz (公開 CSV) で取得 (シートが公開のときだけ)
//   node tools/import.js --watch [秒]    定期的にシートを取得し、変わっていたら再生成 (既定 15 秒)
//   node tools/import.js --no-selftest   生成だけ
// 認証は tools/sync.ps1 (gcloud ADC + 自前 OAuth クライアント)。
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, DATA_DIR, SHEET_ID_FILE, TABLES, MASTERDATA_PROFILES, toCsv, buildTablesFromCsv, writeProfile, readSheetId } from "./lib.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : null;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sheetId() {
  const given = flagValue("--sheet");
  if (given) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SHEET_ID_FILE, given, "utf8");
    return given;
  }
  if (flag("--local")) return null;
  return readSheetId();
}

function saveCsvIfChanged(name, csv) {
  const file = path.join(DATA_DIR, `${name}.csv`);
  const old = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (old !== csv) {
    fs.writeFileSync(file, csv, "utf8");
    return true;
  }
  return false;
}

async function fetchTableGviz(id, name) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  if (!res.ok || /^\s*</.test(text)) {
    throw new Error(
      `シート "${name}" を取得できない (HTTP ${res.status})。共有設定が「リンクを知っている全員が閲覧可」か、タブ "${name}" があるか確認して`,
    );
  }
  return text;
}

async function fetchAllGviz(id) {
  let changed = false;
  for (const table of TABLES) {
    process.stdout.write(`fetch ${table.name} ... `);
    let csv;
    try {
      csv = await fetchTableGviz(id, table.name);
    } catch (e) {
      if (fs.existsSync(path.join(DATA_DIR, `${table.name}.csv`))) {
        console.log("タブなし → ローカル CSV を使用");
        continue;
      }
      throw e;
    }
    const c = saveCsvIfChanged(table.name, csv);
    changed = changed || c;
    console.log(c ? "更新" : "変更なし");
    await sleep(250);
  }
  return changed;
}

async function fetchAllApi(id) {
  const { fetchAllTables } = await import("./sheets.js");
  const rowsByTable = await fetchAllTables(id);
  let changed = false;
  for (const table of TABLES) {
    if (!rowsByTable[table.name]) continue;
    const c = saveCsvIfChanged(table.name, toCsv(rowsByTable[table.name]));
    changed = changed || c;
    if (c) console.log(`fetch ${table.name} ... 更新`);
  }
  if (!changed) console.log("全テーブル変更なし");
  return changed;
}

export function generate() {
  for (const profile of MASTERDATA_PROFILES) {
    writeProfile(profile, buildTablesFromCsv(profile));
  }
  console.log(`masterdata を生成した (profile: ${MASTERDATA_PROFILES.join(", ")})`);
}

function runSelftest() {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "tools/selftest.js")], { encoding: "utf8" });
    process.stdout.write(out);
    return true;
  } catch (e) {
    process.stdout.write((e.stdout || "") + (e.stderr || ""));
    console.log("★ selftest が失敗。データを直してもう一度どうぞ (masterdata は生成済み)");
    return false;
  }
}

async function main() {
  const id = sheetId();
  const doFetch = flag("--gviz") ? fetchAllGviz : fetchAllApi;

  if (flag("--watch")) {
    if (!id) {
      console.log("--watch はシート ID が必要 (--sheet <ID> を一度実行して)");
      process.exitCode = 1;
      return;
    }
    const interval = Number(flagValue("--watch")) || 15;
    console.log(`シート ${id} を ${interval} 秒ごとに監視。Ctrl+C で終了`);
    for (;;) {
      try {
        const changed = await doFetch(id);
        if (changed) {
          generate();
          if (!flag("--no-selftest")) runSelftest();
        } else console.log(`変更なし (${new Date().toLocaleTimeString()})`);
      } catch (e) {
        console.log("取得エラー: " + e.message);
      }
      await sleep(interval * 1000);
    }
  }

  if (id) await doFetch(id);
  else if (flag("--local")) console.log("--local: data/*.csv から生成");
  else console.log("シート ID 未設定なので data/*.csv から生成 (--sheet <ID> か push.js --create でシート連携)");
  generate();
  if (!flag("--no-selftest") && !runSelftest()) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
