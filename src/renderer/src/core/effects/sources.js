// ============================================================
// いま state 上に存在する効果の発生源 (src) の列挙。family ごとの enumerate を連結するだけ。
// bus (フック) / derived (派生値) / permissions が同じ列挙を使う。
//
// src = { family, key, def, instance?: {uid, memo}, values?, masked?, side?, statusKey? ... }
//   family: status / costume / enemyAction / bookRule / passive / relic / star
//   (item / ability / eventEffect は「使用時」にだけ src を組む)
// 列挙の順序はハンドラの順序に影響しない (order → レジストリ順 → uid で並べ直す)
// ============================================================
import { registry } from "./index.js";
import { enumerate as statuses } from "./statuses/sources.js";
import { enumerate as costumes } from "./costumes/sources.js";
import { enumerate as enemyActions } from "./enemyActions/sources.js";
import { enumerate as bookRules } from "./bookRules/sources.js";
import { enumerate as passives } from "./passives/sources.js";
import { enumerate as relics } from "./relics/sources.js";
import { enumerate as star } from "./star/sources.js";

const ENUMERATORS = [statuses, costumes, enemyActions, bookRules, passives, relics, star];

export function activeSources(state) {
  const out = [];
  for (const enumerate of ENUMERATORS) enumerate(state, out);
  return out;
}

// src に対応するモジュール (無ければ null。マスタの type がレジストリに無い = 検証で警告済み)
export function moduleOf(src) {
  return registry.find(src.family, src.key);
}

export function valuesOf(src) {
  if (src.values) return src.values;
  return src.def?.values || [];
}

// 同点解決用の uid (インスタンスが無ければ 0)
export function uidOf(src) {
  return src.instance?.uid ?? 0;
}
