// =====================================================================
// スプレッドシート入稿の共有ライブラリ (CSV パース / 生成、行 ⇔ オブジェクト変換)。tale から移植 (05_masterdata)
// テーブル定義は core/master/tables.js が正 (tools と core が同じ定義を読む)。
//
// シートの約束事:
//   - 1 テーブル = 1 シート (タブ)。シート名 = テーブル名
//   - ヘッダー行は「カラム名:型」(例: id:integer, name:string)
//   - 型: string / integer (空 = null) / intarray (セル内 JSON [1,2]) / array (セル内 JSON) / boolean (空, FALSE = 偽)
//   - 列展開: actions[0].type:string … → actions: [{type, value}] / passive.type:string → passive: {type, values}
//   - "_" 始まりのカラムはメタ。_skip:boolean が真の行は出力しない。
//     _isTrial / _isCien / _isClean (integer): 空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ出力
//   - ロケール列 (name-en_us など) は定義に無くてもそのまま通す
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TABLES } from "../src/renderer/src/core/master/tables.js";
import { MASTERDATA_PROFILES, profileFlags } from "../config/editions.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = path.join(ROOT, "data");
export const MASTERDATA_DIR = path.join(ROOT, "src/renderer/src/masterdata");
export const SHEET_ID_FILE = path.join(DATA_DIR, "sheet_id.txt");
export { TABLES, MASTERDATA_PROFILES };

// ---------------------------------------------------------------
// CSV (RFC4180)
// ---------------------------------------------------------------
export function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const rows = [];
  let row = [],
    field = "",
    inQuotes = false,
    i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

export function toCsv(rows) {
  const enc = (v) => {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(enc).join(",")).join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------
// 値の型変換
// ---------------------------------------------------------------
export function parseValue(raw, type, where) {
  const v = raw.replace(/\r/g, "");
  if (type === "integer") {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error(`${where}: integer じゃない値 "${v}"`);
    return n;
  }
  if (type === "intarray" || type === "array") {
    if (v === "") return [];
    try {
      return JSON.parse(v);
    } catch (e) {
      throw new Error(`${where}: JSON としてパースできない "${v}"`);
    }
  }
  if (type === "boolean") return !(v === "" || v.toUpperCase() === "FALSE");
  if (type === "string") return v;
  throw new Error(`${where}: 不明な型 ${type}`);
}

export function emitValue(v, type) {
  if (v == null) return "";
  if (type === "intarray" || type === "array") return JSON.stringify(v);
  if (type === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

// ヘッダー 1 個のパース: "actions[0].type:string" など
export function parseHeader(h, where) {
  const m = h.match(/^(.+):(\w+)$/);
  if (!m) throw new Error(`${where}: ヘッダー "${h}" が「カラム名:型」形式じゃない`);
  const [, name, type] = m;
  let m2;
  if ((m2 = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/))) return { kind: "listItem", base: m2[1], index: Number(m2[2]), field: m2[3], type };
  if ((m2 = name.match(/^(\w+)\.(\w+)$/))) return { kind: "objField", base: m2[1], field: m2[2], type };
  return { kind: "plain", name, type };
}

// CSV 行列 → オブジェクト配列 (列展開・メタ列対応)。メタ列は obj._meta = { skip, isTrial, isCien, isClean } に集める
export function rowsToObjects(rows, tableName) {
  if (!rows.length) throw new Error(`${tableName}: ヘッダー行がない`);
  const headers = rows[0].map((h, i) => (h.trim() === "" ? null : parseHeader(h.trim(), `${tableName} 列${i + 1}`)));
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const where = `${tableName} 行${r + 1}`;
    const obj = {};
    const meta = { skip: false, isTrial: null, isCien: null, isClean: null };
    const lists = {};
    const objs = {};
    headers.forEach((h, ci) => {
      if (h == null) return;
      const raw = cells[ci] == null ? "" : cells[ci];
      if (h.kind === "plain") {
        if (h.name.startsWith("_")) {
          if (h.name === "_skip") meta.skip = parseValue(raw, "boolean", where);
          else if (h.name === "_isTrial") meta.isTrial = parseValue(raw, "integer", where);
          else if (h.name === "_isCien") meta.isCien = parseValue(raw, "integer", where);
          else if (h.name === "_isClean") meta.isClean = parseValue(raw, "integer", where);
          return;
        }
        const v = parseValue(raw, h.type, `${where} ${h.name}`);
        if (v !== null) obj[h.name] = v;
      } else if (h.kind === "listItem") {
        const slot = ((lists[h.base] = lists[h.base] || {})[h.index] = lists[h.base][h.index] || { fields: {}, anyFilled: false });
        if (raw !== "") {
          slot.anyFilled = true;
          slot.fields[h.field] = parseValue(raw, h.type, `${where} ${h.base}[${h.index}].${h.field}`);
        }
      } else if (h.kind === "objField") {
        const slot = (objs[h.base] = objs[h.base] || { fields: {}, anyFilled: false });
        if (raw !== "") {
          slot.anyFilled = true;
          slot.fields[h.field] = parseValue(raw, h.type, `${where} ${h.base}.${h.field}`);
        }
      }
    });
    if (meta.skip) continue;
    for (const base of Object.keys(lists)) {
      const indexes = Object.keys(lists[base])
        .map(Number)
        .sort((a, b) => a - b);
      obj[base] = indexes.filter((i) => lists[base][i].anyFilled).map((i) => lists[base][i].fields);
    }
    for (const base of Object.keys(objs)) if (objs[base].anyFilled) obj[base] = objs[base].fields;
    Object.defineProperty(obj, "_meta", { value: meta, enumerable: false });
    out.push(obj);
  }
  return out;
}

// エディション列の判定: 空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ出力
function editionAllows(value, flag) {
  if (value == null || value === 1) return true;
  if (value === 2) return !flag;
  if (value === 3) return flag;
  throw new Error(`エディション列の値が不正: ${value} (空/1/2/3 のどれか)`);
}

export function rowAllowedInProfile(obj, profile) {
  const meta = obj._meta || {};
  const f = profileFlags(profile);
  return editionAllows(meta.isTrial, f.trial) && editionAllows(meta.isCien, f.cien) && editionAllows(meta.isClean, f.clean);
}

// オブジェクト配列 → CSV 行列 (テーブル定義の列順で)
export function objectsToRows(objects, table) {
  const listMax = {};
  for (const col of table.columns) if (col.list) listMax[col.list] = Math.max(1, ...objects.map((o) => (o[col.list] || []).length));
  const headers = [];
  for (const col of table.columns) {
    if (typeof col === "string") headers.push(col);
    else if (col.obj) for (const f of col.fields) headers.push(`${col.obj}.${f}`);
    else if (col.list) for (let i = 0; i < listMax[col.list]; i++) for (const f of col.fields) headers.push(`${col.list}[${i}].${f}`);
  }
  const rows = [headers];
  for (const o of objects) {
    const row = [];
    for (const col of table.columns) {
      if (typeof col === "string") {
        const [name, type] = col.split(":");
        if (name === "_skip") row.push(emitValue(o._meta?.skip ?? false, "boolean"));
        else if (name.startsWith("_is")) row.push(emitValue(o._meta?.[name.slice(1)] ?? null, "integer"));
        else row.push(emitValue(o[name], type));
      } else if (col.obj) {
        for (const f of col.fields) {
          const [fname, ftype] = f.split(":");
          row.push(o[col.obj] ? emitValue(o[col.obj][fname], ftype) : "");
        }
      } else if (col.list) {
        const list = o[col.list] || [];
        for (let i = 0; i < listMax[col.list]; i++) {
          for (const f of col.fields) {
            const [fname, ftype] = f.split(":");
            row.push(list[i] ? emitValue(list[i][fname], ftype) : "");
          }
        }
      }
    }
    rows.push(row);
  }
  return rows;
}

export function assembleTable(table, objects) {
  if (table.mode === "object") {
    if (objects.length !== 1) throw new Error(`${table.name}: データ行はちょうど 1 行のはず (${objects.length} 行ある)`);
    return objects[0];
  }
  return objects;
}

// ---------------------------------------------------------------
// data/*.csv → テーブル群 (profile でエディション列を適用)
// ---------------------------------------------------------------
export function readCsvTable(name) {
  const file = path.join(DATA_DIR, `${name}.csv`);
  if (!fs.existsSync(file)) throw new Error(`data/${name}.csv がない`);
  return parseCsv(fs.readFileSync(file, "utf8"));
}

export function buildTablesFromCsv(profile = "base") {
  const tables = {};
  for (const table of TABLES) {
    const objects = rowsToObjects(readCsvTable(table.name), table.name).filter((o) => rowAllowedInProfile(o, profile));
    tables[table.name] = assembleTable(table, objects);
  }
  return tables;
}

// ---------------------------------------------------------------
// masterdata/<profile>/*.js の生成 (xqueens と同じ「1 テーブル 1 ファイル + index.js」)
// ---------------------------------------------------------------
const HEADER = `// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。\n`;

export function writeProfile(profile, tables) {
  const dir = path.join(MASTERDATA_DIR, profile);
  fs.mkdirSync(dir, { recursive: true });
  for (const table of TABLES) {
    const body = JSON.stringify(tables[table.name], null, 2);
    fs.writeFileSync(path.join(dir, `${table.name}.js`), `${HEADER}export default ${body};\n`, "utf8");
  }
  const imports = TABLES.map((t) => `import ${t.name} from "./${t.name}.js";`).join("\n");
  const keys = TABLES.map((t) => `  ${t.name},`).join("\n");
  fs.writeFileSync(path.join(dir, "index.js"), `${HEADER}// profile: ${profile}\n${imports}\n\nexport default {\n${keys}\n};\n`, "utf8");
}

export function readSheetId() {
  return fs.existsSync(SHEET_ID_FILE) ? fs.readFileSync(SHEET_ID_FILE, "utf8").trim() : null;
}
