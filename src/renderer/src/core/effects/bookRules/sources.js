// bookRule family の発生源: 挑戦中の本のルール (常時)
import { master } from "../../master/index.js";

export function enumerate(state, out) {
  for (const rule of master.where("bookRules", "bookId", state.bookId)) {
    out.push({ family: "bookRule", key: rule.key, def: rule, values: rule.values || [] });
  }
}
