// =====================================================================
// data/*.csv → Google スプレッドシートへ書き込み (Sheets API / 要認証)。tale から移植
//
//   node tools/push.js --create [タイトル]   シートを新規作成して全テーブルを投入。ID を data/sheet_id.txt に保存
//   node tools/push.js                       data/sheet_id.txt のシートへ全テーブルを上書き投入 (シート側の内容は消える)
// =====================================================================
import fs from "node:fs";
import { DATA_DIR, SHEET_ID_FILE, TABLES, readCsvTable, readSheetId } from "./lib.js";
import { pushAllTables, createSpreadsheet } from "./sheets.js";

const args = process.argv.slice(2);

async function main() {
  const rowsByTable = {};
  for (const t of TABLES) rowsByTable[t.name] = readCsvTable(t.name);

  let id;
  if (args.includes("--create")) {
    const i = args.indexOf("--create");
    const title = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "オラクルちゃんと呪いの本 マスターデータ";
    const created = await createSpreadsheet(title);
    id = created.spreadsheetId;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SHEET_ID_FILE, id, "utf8");
    console.log(`シート作成: ${created.spreadsheetUrl}`);
  } else {
    id = readSheetId();
    if (!id) throw new Error("data/sheet_id.txt がない。初回は node tools/push.js --create で");
  }

  await pushAllTables(id, rowsByTable);
  const total = TABLES.reduce((s, t) => s + rowsByTable[t.name].length - 1, 0);
  console.log(`push 完了: ${TABLES.length} テーブル ${total} 行 → https://docs.google.com/spreadsheets/d/${id}/edit`);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
