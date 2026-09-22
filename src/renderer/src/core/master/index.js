// ============================================================
// マスタのアクセサ。テーブルの中身は起動時に注入する (loadMaster)。
//   app:   import tables from "@masterdata/index.js"; loadMaster(tables)
//   tools: CSV から組んだテーブル群を loadMaster
//   test:  同上 (vitest の alias で base profile)
// マスタは常に信頼できるソースとして扱い、無い id を引いたら例外にする (フォールバックしない)。
// ============================================================

import { TABLE_NAMES } from "./tables.js";

let current = null;

export function loadMaster(tables) {
  const missing = TABLE_NAMES.filter((name) => !(name in tables));
  if (missing.length) throw new Error(`masterdata に無いテーブル: ${missing.join(", ")}`);
  const byId = {};
  const byKey = {};
  for (const name of TABLE_NAMES) {
    const rows = tables[name];
    if (!Array.isArray(rows)) continue; // config (object)
    byId[name] = {};
    byKey[name] = {};
    for (const row of rows) {
      if (row.id != null) byId[name][row.id] = row;
      if (typeof row.key === "string") (byKey[name][row.key] ||= []).push(row);
    }
  }
  current = { tables, byId, byKey };
  return current;
}

export function isMasterLoaded() {
  return current != null;
}

function ensure() {
  if (!current) throw new Error("masterdata が読み込まれていない (loadMaster を先に呼ぶ)");
  return current;
}

export const master = {
  // 全行
  all(title) {
    const rows = ensure().tables[title];
    if (rows === undefined) throw new Error(`unknown master table: ${title}`);
    return rows;
  },
  // config (1 行テーブル)
  get config() {
    return ensure().tables.config;
  },
  // id で 1 行。無ければ例外
  get(title, id) {
    const row = ensure().byId[title]?.[id];
    if (!row) throw new Error(`master ${title} に id=${id} が無い`);
    return row;
  },
  // id で 1 行。無ければ null (存在確認用)
  find(title, id) {
    return ensure().byId[title]?.[id] ?? null;
  },
  // key で 1 行 (statuses, characters, systemTexts...)。無ければ例外
  byKey(title, key) {
    const rows = ensure().byKey[title]?.[key];
    if (!rows || rows.length === 0) throw new Error(`master ${title} に key=${key} が無い`);
    return rows[0];
  },
  findByKey(title, key) {
    return ensure().byKey[title]?.[key]?.[0] ?? null;
  },
  // column === value の行
  where(title, column, value) {
    return this.all(title).filter((row) => row[column] === value);
  },
  whereSorted(title, column, value) {
    return this.where(title, column, value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
  // systemTexts の key → text
  text(key) {
    const row = this.findByKey("systemTexts", key);
    if (!row) throw new Error(`systemTexts に key=${key} が無い`);
    return row.text;
  },
};

export default master;
