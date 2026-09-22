// =====================================================================
// スプレッドシートの条件付き書式を流し込む (Sheets API / 要認証)。tale から移植
//   node tools/format.js   data/sheet_id.txt のシートに書式ルールを設定
// enemyActions … 「敵 1 体につき 4 行」のまとまりを しましま に、_skip 行は薄字
// =====================================================================
import { readSheetId } from "./lib.js";
import { API, api } from "./sheets.js";

const MAX_ROWS = 1000;
const STRIPE = { red: 0.91, green: 0.94, blue: 1 };
const DIM = { red: 0.62, green: 0.62, blue: 0.62 };

function zebraByGroup(tab, groupCol, lastCol, skipCol) {
  const even = `ISEVEN(COUNTUNIQUE($${groupCol}$2:$${groupCol}2))`;
  const notEmpty = `$${groupCol}2<>""`;
  const rules = [];
  if (skipCol) {
    rules.push({ formula: `=AND(${notEmpty}, $${skipCol}2=TRUE, ${even})`, bg: STRIPE, fg: DIM });
    rules.push({ formula: `=AND(${notEmpty}, $${skipCol}2=TRUE)`, fg: DIM });
  }
  rules.push({ formula: `=AND(${notEmpty}, ${even})`, bg: STRIPE });
  return { tab, lastCol, rules };
}

// enemyActions の列: A=_skip, B..D=_isTrial/_isCien/_isClean, E=id, F=enemyId, ... (core/master/tables.js の並び)
const SPECS = [zebraByGroup("enemyActions", "F", "M", "A")];

const colIndex = (letter) => letter.toUpperCase().charCodeAt(0) - 64;

async function main() {
  const id = readSheetId();
  if (!id) throw new Error("data/sheet_id.txt がない。先に node tools/push.js --create で");
  const meta = await api("GET", `${API}/${id}?fields=sheets(properties(sheetId,title),conditionalFormats)`);
  const requests = [];
  const summary = [];
  for (const spec of SPECS) {
    const sheet = (meta.sheets || []).find((s) => s.properties.title === spec.tab);
    if (!sheet) {
      console.log(`タブ "${spec.tab}" がない (push.js でタブを作ってから)`);
      continue;
    }
    const sid = sheet.properties.sheetId;
    const existing = (sheet.conditionalFormats || []).length;
    for (let i = 0; i < existing; i++) requests.push({ deleteConditionalFormatRule: { sheetId: sid, index: 0 } });
    const range = { sheetId: sid, startRowIndex: 1, endRowIndex: MAX_ROWS, startColumnIndex: 0, endColumnIndex: colIndex(spec.lastCol) };
    spec.rules.forEach((r, i) => {
      const format = {};
      if (r.bg) format.backgroundColor = r.bg;
      if (r.fg) format.textFormat = { foregroundColor: r.fg };
      requests.push({
        addConditionalFormatRule: {
          index: i,
          rule: { ranges: [range], booleanRule: { condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: r.formula }] }, format } },
        },
      });
    });
    summary.push(`${spec.tab}: 既存 ${existing} 本を消して ${spec.rules.length} 本を設定`);
  }
  if (!requests.length) {
    console.log("設定するものがない");
    return;
  }
  await api("POST", `${API}/${id}:batchUpdate`, { requests });
  for (const s of summary) console.log(s);
  console.log(`書式設定 完了 → https://docs.google.com/spreadsheets/d/${id}/edit`);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
