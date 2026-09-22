// =====================================================================
// Google Sheets API ヘルパー (gcloud の ADC 認証でトークンを取る方式)。tale から移植
//   前提: tools/sync.ps1 を一度実行して認証済みであること。
//   npm 依存なし: gcloud auth application-default print-access-token でトークンを取り、REST API を fetch で叩く。
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { TABLES } from "./lib.js";

export const API = "https://sheets.googleapis.com/v4/spreadsheets";

export function findGcloud() {
  if (process.env.GCLOUD) return process.env.GCLOUD;
  const candidates = [
    path.join(process.env.LOCALAPPDATA || "", "Google", "Cloud SDK", "google-cloud-sdk", "bin", "gcloud.cmd"),
    path.join(process.env.ProgramFiles || "", "Google", "Cloud SDK", "google-cloud-sdk", "bin", "gcloud.cmd"),
  ];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  return process.platform === "win32" ? "gcloud.cmd" : "gcloud";
}

let cachedToken = null;
function getToken() {
  if (cachedToken) return cachedToken;
  try {
    // .cmd は execFileSync だと EINVAL になる (Node のシェル制限) ので execSync + クォートで
    cachedToken = execSync(`"${findGcloud()}" auth application-default print-access-token`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return cachedToken;
  } catch (e) {
    throw new Error(
      "gcloud の認証トークンが取れない。tools\\sync.ps1 を実行して認証して (ブラウザが開く)。\n  元エラー: " + String(e.message).split("\n")[0],
    );
  }
}

function quotaProject() {
  try {
    const adc = path.join(process.env.APPDATA || "", "gcloud", "application_default_credentials.json");
    return JSON.parse(fs.readFileSync(adc, "utf8")).quota_project_id || null;
  } catch (e) {
    return null;
  }
}

export async function api(method, url, body) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  const qp = quotaProject();
  if (qp) headers["x-goog-user-project"] = qp;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    /* HTML エラーページ等 */
  }
  if (!res.ok) {
    const msg = (json.error && json.error.message) || text.slice(0, 300);
    let hint = "";
    if (/ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient.*scope/i.test(text))
      hint = "\n  → スコープ不足。tools\\sync.ps1 -Relogin で spreadsheets スコープ付きで認証しなおして";
    else if (/SERVICE_DISABLED|has not been used in project|is disabled/i.test(text))
      hint = "\n  → Sheets API が無効。gcloud services enable sheets.googleapis.com で有効化して";
    else if (/quota project/i.test(text)) hint = "\n  → gcloud auth application-default set-quota-project <プロジェクトID> を実行して";
    else if (/invalid_grant|Token has been expired or revoked/i.test(text))
      hint = "\n  → リフレッシュトークン失効 (テスト中アプリは 7 日)。tools\\sync.ps1 -Relogin (未 push の CSV 編集は先に stash)";
    else if (res.status === 404) hint = "\n  → スプレッドシート ID が違うか、このアカウントに閲覧権限がない";
    throw new Error(`Sheets API ${res.status}: ${msg}${hint}`);
  }
  return json;
}

// 読み: 全テーブルを 1 リクエストで取得 → {テーブル名: 文字列セルの行列}。無いタブは undefined
export async function fetchAllTables(sheetId) {
  const meta = await api("GET", `${API}/${sheetId}?fields=sheets.properties.title`);
  const existing = new Set((meta.sheets || []).map((s) => s.properties.title));
  const present = TABLES.filter((t) => existing.has(t.name));
  const ranges = present.map((t) => `ranges=${encodeURIComponent(`'${t.name}'!A1:ZZ`)}`).join("&");
  const json = await api("GET", `${API}/${sheetId}/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&${ranges}`);
  const out = {};
  (json.valueRanges || []).forEach((vr, i) => {
    const name = present[i].name;
    const rows = (vr.values || []).map((row) => row.map((c) => String(c == null ? "" : c))).filter((row) => row.some((c) => c !== ""));
    if (!rows.length) throw new Error(`シートのタブ "${name}" が空 (ヘッダー行もない)`);
    out[name] = rows;
  });
  return out;
}

// 書き: タブがなければ作り、全消し → 全書き込み
export async function pushAllTables(sheetId, rowsByTable) {
  const meta = await api("GET", `${API}/${sheetId}?fields=sheets.properties.title`);
  const existing = new Set((meta.sheets || []).map((s) => s.properties.title));
  const missing = TABLES.filter((t) => !existing.has(t.name));
  if (missing.length) {
    await api("POST", `${API}/${sheetId}:batchUpdate`, { requests: missing.map((t) => ({ addSheet: { properties: { title: t.name } } })) });
    console.log("タブ作成: " + missing.map((t) => t.name).join(", "));
  }
  await api("POST", `${API}/${sheetId}/values:batchClear`, { ranges: TABLES.map((t) => `'${t.name}'!A1:ZZ`) });
  await api("POST", `${API}/${sheetId}/values:batchUpdate`, {
    valueInputOption: "USER_ENTERED",
    data: TABLES.map((t) => ({ range: `'${t.name}'!A1`, values: rowsByTable[t.name] })),
  });
}

export async function createSpreadsheet(title) {
  return api("POST", API, { properties: { title }, sheets: TABLES.map((t) => ({ properties: { title: t.name } })) });
}
