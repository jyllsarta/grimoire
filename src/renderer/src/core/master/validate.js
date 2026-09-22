// ============================================================
// マスタ検証 (05「検証 (selftest がやること)」)。レジストリ駆動。
// 通らなくても起動はする: 問題を { level, table, id, message } の配列で返し、
// selftest / CI は失敗扱い、dev ビルドはインスペクタに警告バッジを出す。
// ============================================================

import { TABLES } from "./tables.js";
import { registry } from "../effects/index.js";

const ENTITY_TABLES = { equipment: "equipments", item: "items", ability: "abilities" };

export function validateMaster(tables, { requiredTextKeys = [] } = {}) {
  const problems = [];
  const warn = (table, id, message) => problems.push({ level: "warn", table, id, message });
  const error = (table, id, message) => problems.push({ level: "error", table, id, message });

  const rows = (name) => (Array.isArray(tables[name]) ? tables[name] : []);
  const ids = {};
  for (const t of TABLES) {
    if (t.mode === "object") continue;
    const set = new Set();
    for (const r of rows(t.name)) {
      const key = r.id ?? r.key;
      if (key == null) {
        error(t.name, null, "id / key が無い行");
        continue;
      }
      if (set.has(key)) error(t.name, key, `id が重複`);
      set.add(key);
    }
    ids[t.name] = set;
  }
  const has = (table, id) => ids[table]?.has(id);
  const ref = (table, id, column, targetTable, value) => {
    if (value == null) return;
    if (!has(targetTable, value)) error(table, id, `${column}=${value} が ${targetTable} に無い`);
  };
  const refs = (table, id, column, targetTable, values) => {
    for (const v of values || []) ref(table, id, column, targetTable, v);
  };
  const charRef = (table, id, value) => {
    if (value == null || value === -1) return;
    ref(table, id, "characterId", "characters", value);
  };

  // ---- 参照 ----
  for (const b of rows("books")) {
    ref("books", b.id, "characterId", "characters", b.characterId);
    refs("books", b.id, "chapterIds", "chapters", b.chapterIds);
    ref("books", b.id, "extraChapterId", "chapters", b.extraChapterId);
    if (!b.chapterIds?.length) error("books", b.id, "chapterIds が空");
  }
  for (const r of rows("bookRules")) {
    ref("bookRules", r.id, "bookId", "books", r.bookId);
    checkType("bookRules", r.id, "bookRule", r.key, r.values, { error, warn, has });
  }
  for (const c of rows("chapters")) {
    refs("chapters", c.id, "enemyIds", "enemies", c.enemyIds);
    ref("chapters", c.id, "bossEnemyId", "enemies", c.bossEnemyId);
    refs("chapters", c.id, "equipmentIds", "equipments", c.equipmentIds);
    refs("chapters", c.id, "itemIds", "items", c.itemIds);
    refs("chapters", c.id, "abilityIds", "abilities", c.abilityIds);
    refs("chapters", c.id, "eventIds", "events", c.eventIds);
    const boss = rows("enemies").find((e) => e.id === c.bossEnemyId);
    if (boss && boss.kind === "placeholder") error("chapters", c.id, `bossEnemyId=${c.bossEnemyId} が placeholder (ボスは固定)`);
    if (!(c.width >= 1)) error("chapters", c.id, `width=${c.width} が不正`);
  }
  for (const c of rows("characters")) {
    for (const [col, table] of [
      ["initialEquipmentIds", "equipments"],
      ["initialItemIds", "items"],
      ["initialAbilityIds", "abilities"],
      ["startEquipmentIds", "equipments"],
      ["startItemIds", "items"],
      ["startAbilityIds", "abilities"],
    ]) {
      refs("characters", c.id, col, table, c[col]);
    }
    // 開始インベントリがマスに入るか
    const size = [
      ...(c.startEquipmentIds || []).map((id) => rows("equipments").find((e) => e.id === id)?.size ?? 0),
      ...(c.startItemIds || []).map((id) => rows("items").find((e) => e.id === id)?.size ?? 0),
      ...(c.startAbilityIds || []).map((id) => rows("abilities").find((e) => e.id === id)?.size ?? 0),
    ].reduce((a, b) => a + b, 0);
    if (tables.config && size > tables.config.startSlots)
      error("characters", c.id, `開始インベントリの合計サイズ ${size} が startSlots=${tables.config.startSlots} を超える`);
  }
  for (const e of rows("enemies")) {
    if (!["normal", "placeholder", "characterUnique"].includes(e.kind)) error("enemies", e.id, `kind="${e.kind}" が不正`);
    if (e.kind === "characterUnique") charRef("enemies", e.id, e.characterId);
    if ((e.kind === "placeholder" || e.kind === "characterUnique") && !(e.slot >= 1)) error("enemies", e.id, `slot=${e.slot} が不正`);
    if (!(e.hp >= 1)) error("enemies", e.id, `hp=${e.hp} が不正`);
  }
  const statusKeys = new Set(rows("statuses").map((s) => s.key));
  const applicableStatusKeys = new Set(
    rows("statuses")
      .filter((s) => s.kind === "common" || s.kind === "unique")
      .map((s) => s.key),
  );
  for (const a of rows("enemyActions")) {
    ref("enemyActions", a.id, "enemyId", "enemies", a.enemyId);
    for (const act of a.actions || []) {
      if (registry.has("enemyAction", act.type)) {
        checkValues("enemyActions", a.id, registry.find("enemyAction", act.type), [act.value ?? 0], { error, warn, has }, true);
      } else if (!applicableStatusKeys.has(act.type)) {
        error("enemyActions", a.id, `actions.type="${act.type}" が enemyAction モジュールにも statuses (common|unique) にも無い`);
      }
    }
  }
  for (const e of rows("equipments")) {
    charRef("equipments", e.id, e.characterId);
    if (!["weapon", "armor"].includes(e.category)) error("equipments", e.id, `category="${e.category}" が不正`);
    if (!(e.size >= 1)) error("equipments", e.id, `size=${e.size} が不正`);
    if (e.passive?.type) checkType("equipments", e.id, "passive", e.passive.type, e.passive.values || [], { error, warn, has });
  }
  for (const i of rows("items")) {
    charRef("items", i.id, i.characterId);
    if (!(i.size >= 1)) error("items", i.id, `size=${i.size} が不正`);
    checkType("items", i.id, "item", i.type, i.values, { error, warn, has });
  }
  for (const a of rows("abilities")) {
    charRef("abilities", a.id, a.characterId);
    if (!(a.size >= 1)) error("abilities", a.id, `size=${a.size} が不正`);
    checkType("abilities", a.id, "ability", a.type, a.values, { error, warn, has });
    const RECHARGE = ["exhaust", "justLethal", "damageTaken", "turn", "kill", "otherAbilityUse", "none"];
    if (!RECHARGE.includes(a.rechargeType)) error("abilities", a.id, `rechargeType="${a.rechargeType}" が不正`);
  }
  for (const r of rows("relics")) {
    charRef("relics", r.id, r.characterId);
    checkType("relics", r.id, "relic", r.type, r.values, { error, warn, has });
  }
  for (const s of rows("statuses")) {
    if (!["common", "unique", "costume", "buff"].includes(s.kind)) error("statuses", s.id, `kind="${s.kind}" が不正`);
    if (!["bad", "good", "neutral"].includes(s.polarity)) error("statuses", s.id, `polarity="${s.polarity}" が不正`);
    if (!["player", "enemy", "both"].includes(s.side)) error("statuses", s.id, `side="${s.side}" が不正`);
    if (!["stack", "turn", "permanent"].includes(s.duration)) error("statuses", s.id, `duration="${s.duration}" が不正`);
    if (s.kind === "unique") charRef("statuses", s.id, s.characterId);
    if (s.next && !statusKeys.has(s.next)) error("statuses", s.id, `next="${s.next}" が statuses に無い`);
    const family = s.kind === "costume" ? "costume" : "status";
    checkType("statuses", s.id, family, s.effect || s.key, s.values, { error, warn, has });
  }
  if (!statusKeys.has("normal")) error("statuses", null, `衣装 key="normal" が無い (player.costume の初期値)`);
  for (const e of rows("events")) {
    if (!["normal", "misfortune", "placeholder"].includes(e.kind)) error("events", e.id, `kind="${e.kind}" が不正`);
    charRef("events", e.id, e.characterId);
    refs("events", e.id, "choiceIds", "eventChoices", e.choiceIds);
    if (e.kind !== "placeholder" && !e.choiceIds?.length) error("events", e.id, "choiceIds が空");
  }
  for (const c of rows("eventChoices")) {
    for (const eff of c.effects || []) checkType("eventChoices", c.id, "eventEffect", eff.type, [eff.value ?? 0], { error, warn, has }, true);
  }
  const origins = {};
  for (const n of rows("starNodes")) {
    ref("starNodes", n.id, "characterId", "characters", n.characterId);
    refs("starNodes", n.id, "fromIds", "starNodes", n.fromIds);
    if (!["origin", "node", "gate"].includes(n.kind)) error("starNodes", n.id, `kind="${n.kind}" が不正`);
    if (n.kind === "origin") origins[n.characterId] = (origins[n.characterId] || 0) + 1;
    if (n.kind === "node") checkType("starNodes", n.id, "star", n.effectType, n.values, { error, warn, has });
    if (n.kind === "gate" && !["clearAny", "clearDelta", "crowns", "playedAny", "happyAny"].includes(n.gateType))
      error("starNodes", n.id, `gateType="${n.gateType}" が不正`);
  }
  for (const [cid, n] of Object.entries(origins)) if (n !== 1) error("starNodes", null, `characterId=${cid} の origin が ${n} 個`);
  for (const p of rows("starPresets")) {
    ref("starPresets", p.id, "characterId", "characters", p.characterId);
    refs("starPresets", p.id, "nodeIds", "starNodes", p.nodeIds);
    if (!["easy", "normal", "hard"].includes(p.difficulty)) error("starPresets", p.id, `difficulty="${p.difficulty}" が不正`);
  }
  for (const s of rows("skits")) {
    ref("skits", s.id, "characterId", "characters", s.characterId);
    if (!["talk", "scene"].includes(s.type)) error("skits", s.id, `type="${s.type}" が不正`);
  }
  for (const l of rows("skitLines")) {
    ref("skitLines", l.id, "skitId", "skits", l.skitId);
    if (l.speaker !== "protagonist" && !rows("characters").some((c) => c.key === l.speaker))
      error("skitLines", l.id, `speaker="${l.speaker}" が characters.key にも protagonist にも無い`);
  }
  for (const s of rows("characterScripts")) ref("characterScripts", s.id, "characterId", "characters", s.characterId);

  // placeholder の解決可能性 (全ヒロイン × 章で使われる全 slot)
  const heroineIds = [...new Set(rows("books").map((b) => b.characterId))];
  const usedEnemySlots = new Set();
  const usedEventSlots = new Set();
  for (const c of rows("chapters")) {
    for (const id of c.enemyIds || []) {
      const e = rows("enemies").find((x) => x.id === id);
      if (e?.kind === "placeholder") usedEnemySlots.add(e.slot);
    }
    for (const id of c.eventIds || []) {
      const e = rows("events").find((x) => x.id === id);
      if (e?.kind === "placeholder") usedEventSlots.add(e.slot);
    }
  }
  for (const cid of heroineIds) {
    for (const slot of usedEnemySlots) {
      if (!rows("enemies").some((e) => e.kind === "characterUnique" && e.characterId === cid && e.slot === slot))
        error("enemies", null, `characterId=${cid} の slot=${slot} の characterUnique が無い (placeholder を解決できない)`);
    }
    for (const slot of usedEventSlots) {
      if (!rows("events").some((e) => e.kind !== "placeholder" && e.characterId === cid && e.slot === slot))
        error("events", null, `characterId=${cid} の slot=${slot} の固有イベントが無い (placeholder を解決できない)`);
    }
  }

  // systemTexts の網羅
  const textKeys = new Set(rows("systemTexts").map((t) => t.key));
  for (const key of requiredTextKeys) if (!textKeys.has(key)) warn("systemTexts", key, `T("${key}") が使われているが systemTexts に無い`);

  // config
  if (!tables.config) error("config", null, "config が無い");
  else {
    for (const k of ["startSlots", "maxSlots", "shopSlots", "rerollPrice", "harshnessWeightMisfortune", "harshnessWeightStatus"]) {
      if (typeof tables.config[k] !== "number") error("config", null, `${k} が数値でない`);
    }
  }

  return problems;
}

// type ∈ レジストリ と values の個数・値域・refs
function checkType(table, id, family, type, values, { error, warn, has }, loose = false) {
  if (type == null || type === "") {
    error(table, id, `${family} の type が空`);
    return;
  }
  const mod = registry.find(family, type);
  if (!mod) {
    error(table, id, `type="${type}" が ${family} モジュールに無い`);
    return;
  }
  checkValues(table, id, mod, values, { error, warn, has }, loose);
}

function checkValues(table, id, mod, values, { error, warn, has }, loose) {
  const v = values || [];
  if (!loose && v.length !== mod.values.length) {
    error(
      table,
      id,
      `${mod.family}.${mod.key} の values は ${mod.values.length} 個 (${mod.values.map((x) => x.name).join(", ")}) だが ${v.length} 個`,
    );
  }
  mod.values.forEach((schema, i) => {
    const x = v[i];
    if (x == null) return;
    if (schema.type === "int" && !Number.isInteger(x)) error(table, id, `${mod.family}.${mod.key} values[${i}] (${schema.name}) が整数でない: ${x}`);
    if (schema.min != null && x < schema.min) error(table, id, `${mod.family}.${mod.key} values[${i}] (${schema.name}) が ${schema.min} 未満: ${x}`);
    if (schema.max != null && x > schema.max) error(table, id, `${mod.family}.${mod.key} values[${i}] (${schema.name}) が ${schema.max} 超: ${x}`);
  });
  for (const r of mod.refs) {
    const x = v[r.index];
    if (x != null && !has(r.table, x)) error(table, id, `${mod.family}.${mod.key} values[${r.index}]=${x} が ${r.table} に無い`);
  }
}

export function formatProblems(problems) {
  return problems.map((p) => `[${p.level}] ${p.table}${p.id != null ? `#${p.id}` : ""}: ${p.message}`);
}
