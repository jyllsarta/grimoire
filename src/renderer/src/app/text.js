// systemTexts の T(key, params) (05 / 08)。キーは文字列リテラルで書く (静的走査のため。三項演算子でキーを組まない)
import { master } from "@core/master/index.js";

const cache = new Map();

export function T(key, params = null) {
  let text = cache.get(key);
  if (text === undefined) {
    const row = master.findByKey("systemTexts", key);
    if (!row) {
      console.warn(`systemTexts に key="${key}" が無い`);
      text = key;
    } else text = row.text;
    cache.set(key, text);
  }
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => (params[name] !== undefined ? String(params[name]) : m));
}

export function resetTextCache() {
  cache.clear();
}

// reason キー → 表示文言 (systemTexts の reason.<key>。無ければ key をそのまま)
export function reasonText(reason) {
  const row = master.findByKey("systemTexts", `reason.${reason}`);
  return row ? row.text : reason;
}
