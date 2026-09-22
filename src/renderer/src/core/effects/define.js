// ============================================================
// 効果モジュール契約 (03「効果モジュール契約」)
//
// defineEffect({
//   family,      "status" / "costume" / "bookRule" / "passive" / "relic" / "star" / "item" / "ability" / "enemyAction" / "eventEffect"
//   key,         family 内で一意。マスタの type (または statuses.key) と一致
//   values,      マスタ values の schema: [{ name, type: "int", min?, max? }]。検証と SCHEMA が読む
//   refs,        values の中で他テーブルを指すもの: [{ index, table }]
//   text,        UI 向けヒント (図形、チップ)。ロジックは見ない
//   use(ctx, src),          item / ability の使用時の効果
//   hooks:       { [step]: { order, when?, run } }
//   modifiers:   { [derivedName]: { stage, order, apply } }   apply は {label, value} か null
//   permissions: { [permissionName]: { order, check } }       check が理由キーを返したら不許可
//   lists:       { [listName]: { order, provide } }
//   status 固有: side, duration, onApply, onExpire, flags (04)
// })
// ============================================================

export const FAMILIES = ["status", "costume", "bookRule", "passive", "relic", "star", "item", "ability", "enemyAction", "eventEffect"];
export const STAGES = ["base", "flat", "mult", "final"];
export const DEFAULT_ORDER = 100; // 省略時「標準処理 (500) より前」

export function defineEffect(def) {
  if (!FAMILIES.includes(def.family)) throw new Error(`defineEffect: unknown family "${def.family}" (${def.key})`);
  if (typeof def.key !== "string" || !def.key) throw new Error(`defineEffect: key が無い (family=${def.family})`);

  const hooks = {};
  for (const [step, hook] of Object.entries(def.hooks || {})) {
    if (typeof hook.run !== "function") throw new Error(`defineEffect ${def.family}.${def.key}: hooks["${step}"].run が関数でない`);
    hooks[step] = { order: hook.order ?? DEFAULT_ORDER, when: hook.when ?? null, run: hook.run };
  }
  const modifiers = {};
  for (const [name, mod] of Object.entries(def.modifiers || {})) {
    if (!STAGES.includes(mod.stage)) throw new Error(`defineEffect ${def.family}.${def.key}: modifiers.${name}.stage "${mod.stage}" が不正`);
    if (typeof mod.apply !== "function") throw new Error(`defineEffect ${def.family}.${def.key}: modifiers.${name}.apply が関数でない`);
    modifiers[name] = { stage: mod.stage, order: mod.order ?? DEFAULT_ORDER, apply: mod.apply };
  }
  const permissions = {};
  for (const [name, perm] of Object.entries(def.permissions || {})) {
    if (typeof perm.check !== "function") throw new Error(`defineEffect ${def.family}.${def.key}: permissions.${name}.check が関数でない`);
    permissions[name] = { order: perm.order ?? DEFAULT_ORDER, check: perm.check };
  }
  const lists = {};
  for (const [name, list] of Object.entries(def.lists || {})) {
    if (typeof list.provide !== "function") throw new Error(`defineEffect ${def.family}.${def.key}: lists.${name}.provide が関数でない`);
    lists[name] = { order: list.order ?? DEFAULT_ORDER, provide: list.provide };
  }

  return Object.freeze({
    family: def.family,
    key: def.key,
    values: def.values || [],
    refs: def.refs || [],
    text: def.text || {},
    use: def.use || null,
    hooks,
    modifiers,
    permissions,
    lists,
    // status 固有 (04)
    onApply: def.onApply || null,
    onExpire: def.onExpire || null,
    flags: def.flags || {},
  });
}
