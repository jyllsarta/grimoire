// ============================================================
// 派生値 (内訳付き) / 許可 / 派生リスト (03「派生値 (内訳付き)」)
//
// derive(name, ctx, args) は base → 効果モジュールの modifiers を stage (base → flat → mult → final) の順、
// 同 stage 内は処理順の規則 (order → レジストリ順 → uid) で適用し、内訳 (breakdown) を記録する。
//   kind: "number" (flat は加算、mult は乗算) / "choice" (後の寄与が値を置き換える) / "flags" (集合に足す)
// permission(name, ctx, args) は base の理由 → 効果モジュールの permissions を order 順に見て、最初の理由キーで不許可。
// list(name, ctx, args) は base 配列に provide の結果を order 順で連結する。
// ============================================================

import { master } from "../master/index.js";
import { activeSources, moduleOf, uidOf, battleEnemy } from "./sources.js";
import { registry } from "../effects/index.js";
import { entitySize } from "../domain/entity.js";
import { currentChapter } from "../domain/chapter.js";

const STAGE_ORDER = { base: 0, flat: 1, mult: 2, final: 3 };

function sortedModifiers(state, name) {
  const mods = [];
  for (const src of activeSources(state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const m = mod.modifiers[name];
    if (!m) continue;
    mods.push({
      stage: STAGE_ORDER[m.stage],
      order: m.order,
      registryIndex: registry.indexOf(mod),
      uid: uidOf(src),
      src: { ...src, module: mod },
      apply: m.apply,
    });
  }
  mods.sort((a, b) => a.stage - b.stage || a.order - b.order || a.registryIndex - b.registryIndex || a.uid - b.uid);
  return mods;
}

// ---------------------------------------------------------------
// 派生値の定義 (base と後処理)。寄与は効果モジュール側
// ---------------------------------------------------------------
export const DERIVED = {
  maxHp: { kind: "number", base: (ctx) => master.get("characters", ctx.state.characterId).hp, finalize: (v) => Math.max(1, v) },
  startHp: { kind: "number", base: (ctx) => derive("maxHp", ctx), finalize: (v, ctx) => Math.max(1, Math.min(v, derive("maxHp", ctx))) },
  basePower: { kind: "number", base: (ctx) => master.get("characters", ctx.state.characterId).power, finalize: (v) => Math.max(0, v) },
  attackPower: {
    kind: "number",
    base: (ctx) => derive("basePower", ctx),
    // ON の武器の power を標準の flat 寄与として先に載せる (モジュールではなく標準処理)
    standardFlat: (ctx) =>
      ctx.state.inventory.entities
        .filter((e) => e.kind === "equipment" && e.active)
        .map((e) => ({ e, def: master.get("equipments", e.defId) }))
        .filter(({ def }) => def.category === "weapon")
        .map(({ e, def }) => ({ label: "weapon", value: def.power, uid: e.uid, defId: e.defId })),
    finalize: (v) => Math.max(0, v),
  },
  strikeFlags: { kind: "flags", base: () => [] },
  // 敵のいまのルーチンの属性 (pierce など)。enemyAction モジュールが modifiers で寄与する
  enemyStrikeFlags: { kind: "flags", base: () => [] },
  // アビリティ由来ダメージへの加算 (良性ステート abilityDamage)
  abilityDamage: { kind: "number", base: () => 0, finalize: (v) => Math.max(0, v) },
  // ステート付与量 (04 付与規則 2: bad なら star.badDuration+ を足す)
  statusValue: { kind: "number", base: (ctx, args) => args.value, finalize: (v) => Math.max(0, v) },
  blockValue: {
    kind: "number",
    base: () => 0,
    standardFlat: (ctx) =>
      ctx.state.inventory.entities
        .filter((e) => e.kind === "equipment" && e.active)
        .map((e) => ({ e, def: master.get("equipments", e.defId) }))
        .filter(({ def }) => def.category === "armor")
        .map(({ e, def }) => ({ label: "armor", value: def.block, uid: e.uid, defId: e.defId })),
    finalize: (v) => Math.max(0, v),
  },
  enemyAttack: { kind: "number", base: (ctx, args) => args.action.value ?? 0, finalize: (v) => Math.max(0, v) },
  enemyMaxHp: { kind: "number", base: (ctx, args) => master.get("enemies", args.defId).hp, finalize: (v) => Math.max(1, v) },
  turnOrder: {
    kind: "choice",
    base: () => "player",
    // 敵がスタン中は常にプレイヤー先攻 (03 の表の最後の寄与)
    finalize: (v, ctx) => (battleEnemy(ctx.state)?.stunned ? "player" : v),
  },
  slotCount: {
    kind: "number",
    base: () => master.config.startSlots,
    finalize: (v) => Math.max(1, Math.min(v, master.config.maxSlots)),
  },
  panelCost: { kind: "number", base: (ctx, args) => args.def.cost ?? 0, finalize: (v) => Math.max(0, v) },
  killReward: { kind: "number", base: (ctx, args) => master.get("enemies", args.defId).reward ?? 0, finalize: (v) => Math.max(0, v) },
  chapterCoin: { kind: "number", base: (ctx) => master.get("characters", ctx.state.characterId).coins ?? 0, finalize: (v) => Math.max(0, v) },
  jewelGain: {
    kind: "number",
    base: (ctx) => {
      const st = ctx.state;
      const remaining = st.board.cells.filter((c) => c != null).length + st.board.deck.length;
      return st.wallet.coin + remaining + (currentChapter(st).clearJewelBonus ?? 0);
    },
    finalize: (v) => Math.max(0, v),
  },
  crownGain: { kind: "number", base: (ctx) => currentChapter(ctx.state).clearCrownBonus ?? 0, finalize: (v) => Math.max(0, v) },
  healPrice: { kind: "number", base: (ctx) => currentChapter(ctx.state).healPrice ?? 1, finalize: (v) => Math.max(1, v) },
  rerollPrice: { kind: "number", base: () => master.config.rerollPrice, finalize: (v) => Math.max(0, v) },
  battleStartShield: { kind: "number", base: () => 0, finalize: (v) => Math.max(0, v) },
  harshnessScore: {
    kind: "number",
    base: (ctx) => {
      const h = ctx.state.counters.harshness;
      return h.misfortunes * master.config.harshnessWeightMisfortune + (h.statusHits + h.crossBreaks) * master.config.harshnessWeightStatus;
    },
  },
};

export function derive(name, ctx, args = {}) {
  return deriveWithBreakdown(name, ctx, args).value;
}

export function deriveWithBreakdown(name, ctx, args = {}) {
  const def = DERIVED[name];
  if (!def) throw new Error(`unknown derived value: ${name}`);
  const breakdown = [];
  let value = def.base(ctx, args);
  breakdown.push({ stage: "base", label: "base", value });

  if (def.kind === "flags") {
    const flags = new Set(value);
    for (const m of sortedModifiers(ctx.state, name)) {
      const r = m.apply(ctx, m.src, args);
      if (!r) continue;
      flags.add(r.value);
      breakdown.push({ stage: "flat", label: r.label, value: r.value, src: describeSrc(m.src) });
    }
    return { value: [...flags], breakdown };
  }

  if (def.kind === "choice") {
    for (const m of sortedModifiers(ctx.state, name)) {
      const r = m.apply(ctx, m.src, args, value);
      if (!r) continue;
      value = r.value;
      breakdown.push({ stage: "choice", label: r.label, value: r.value, src: describeSrc(m.src) });
    }
    if (def.finalize) {
      const fixed = def.finalize(value, ctx, args);
      if (fixed !== value) breakdown.push({ stage: "clamp", label: "clamp", value: fixed });
      value = fixed;
    }
    return { value, breakdown };
  }

  // number
  const mods = sortedModifiers(ctx.state, name);
  const stages = { flat: [], mult: [], final: [] };
  for (const m of mods) {
    const stageName = Object.keys(STAGE_ORDER).find((k) => STAGE_ORDER[k] === m.stage);
    if (stageName === "base") stages.flat.unshift(m);
    else stages[stageName].push(m);
  }
  if (def.standardFlat) {
    for (const c of def.standardFlat(ctx, args)) {
      value += c.value;
      breakdown.push({ stage: "flat", label: c.label, value: c.value, uid: c.uid, defId: c.defId });
    }
  }
  for (const m of stages.flat) {
    const r = m.apply(ctx, m.src, args, value);
    if (!r) continue;
    value += r.value;
    breakdown.push({ stage: "flat", label: r.label, value: r.value, src: describeSrc(m.src) });
  }
  for (const m of stages.mult) {
    const r = m.apply(ctx, m.src, args, value);
    if (!r) continue;
    value = Math.round(value * r.value);
    breakdown.push({ stage: "mult", label: r.label, value: r.value, src: describeSrc(m.src) });
  }
  for (const m of stages.final) {
    const r = m.apply(ctx, m.src, args, value);
    if (!r) continue;
    value += r.value;
    breakdown.push({ stage: "final", label: r.label, value: r.value, src: describeSrc(m.src) });
  }
  if (def.finalize) {
    const clamped = def.finalize(value, ctx, args);
    if (clamped !== value) breakdown.push({ stage: "clamp", label: "clamp", value: clamped });
    value = clamped;
  }
  return { value, breakdown };
}

function describeSrc(src) {
  return { family: src.family, key: src.key, uid: src.instance?.uid ?? null, statusKey: src.statusKey ?? null, nodeId: src.nodeId ?? null };
}

// ---------------------------------------------------------------
// 許可 (permission)。base が理由を返せば即不許可、次に効果モジュールの permissions を order 順に
// ---------------------------------------------------------------
export const PERMISSIONS = {
  canActivateEquipment: {
    base: (ctx, args) => {
      const ent = args.entity;
      if (!ent || ent.kind !== "equipment") return "notEquipment";
      return null;
    },
  },
  canUseAbility: {
    base: (ctx, args) => {
      const ent = args.entity;
      if (!ent || ent.kind !== "ability") return "notAbility";
      if (!ent.ready) return "abilityNotReady";
      return null;
    },
  },
  canUseItem: {
    base: (ctx, args) => {
      const ent = args.entity;
      if (!ent || ent.kind !== "item") return "notItem";
      const def = master.get("items", ent.defId);
      if (!ctx.state.battle && !def.usableOutOfBattle) return "itemOnlyBattle";
      return null;
    },
  },
  canAct: { base: () => null },
  canApplyStatus: {
    base: (ctx, args) => {
      const def = master.findByKey("statuses", args.key);
      if (!def) return "unknownStatus";
      const side = args.target === "player" ? "player" : "enemy";
      if (def.side !== "both" && def.side !== side) return "sideMismatch";
      if (def.kind === "unique" && def.characterId !== ctx.state.characterId) return "otherHeroineUnique";
      return null;
    },
  },
};

export function permission(name, ctx, args = {}) {
  const def = PERMISSIONS[name];
  if (!def) throw new Error(`unknown permission: ${name}`);
  const baseReason = def.base(ctx, args);
  if (baseReason) return { ok: false, reason: baseReason, src: null };
  const checks = [];
  for (const src of activeSources(ctx.state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const p = mod.permissions[name];
    if (!p) continue;
    checks.push({ order: p.order, registryIndex: registry.indexOf(mod), uid: uidOf(src), src: { ...src, module: mod }, check: p.check });
  }
  checks.sort((a, b) => a.order - b.order || a.registryIndex - b.registryIndex || a.uid - b.uid);
  for (const c of checks) {
    const reason = c.check(ctx, c.src, args);
    if (reason) return { ok: false, reason, src: describeSrc(c.src) };
  }
  return { ok: true, reason: null, src: null };
}

// ---------------------------------------------------------------
// 派生リスト
// ---------------------------------------------------------------
export const LISTS = {
  // 章開始時にインベントリにある実体の設計図 [{kind, defId}]
  startEntities: {
    base: (ctx) => {
      const c = master.get("characters", ctx.state.characterId);
      return [
        ...c.startEquipmentIds.map((id) => ({ kind: "equipment", defId: id })),
        ...c.startItemIds.map((id) => ({ kind: "item", defId: id })),
        ...c.startAbilityIds.map((id) => ({ kind: "ability", defId: id })),
      ];
    },
  },
  // 章の山札の設計図 [{kind, defId}] (placeholder の解決込み)
  chapterPanelSpecs: {
    base: (ctx, args) => {
      const chapter = master.get("chapters", args.chapterId);
      const c = master.get("characters", ctx.state.characterId);
      const specs = [];
      for (const id of chapter.enemyIds) specs.push({ kind: "enemy", defId: resolveEnemyPlaceholder(ctx.state, id) });
      for (const id of chapter.equipmentIds) specs.push({ kind: "equipment", defId: id });
      for (const id of chapter.itemIds) specs.push({ kind: "item", defId: id });
      for (const id of chapter.abilityIds) specs.push({ kind: "ability", defId: id });
      for (const id of chapter.eventIds) specs.push({ kind: "event", defId: resolveEventPlaceholder(ctx.state, id) });
      for (const id of c.initialEquipmentIds) specs.push({ kind: "equipment", defId: id });
      for (const id of c.initialItemIds) specs.push({ kind: "item", defId: id });
      for (const id of c.initialAbilityIds) specs.push({ kind: "ability", defId: id });
      for (const p of ctx.state.ownedPanels) specs.push({ kind: p.kind, defId: p.defId });
      return specs;
    },
  },
  // 幕間の抽選候補 [{kind, defId}]
  shopCandidates: {
    base: (ctx) => {
      const cid = ctx.state.characterId;
      const owned = new Set(ctx.state.relics.map((r) => r.defId));
      const out = [];
      for (const e of master.all("equipments")) if (e.characterId === cid && !e.locked) out.push({ kind: "equipment", defId: e.id });
      for (const e of master.all("items")) if (e.characterId === cid && !e.locked) out.push({ kind: "item", defId: e.id });
      for (const e of master.all("abilities")) if (e.characterId === cid && !e.locked) out.push({ kind: "ability", defId: e.id });
      for (const r of master.all("relics"))
        if ((r.characterId === -1 || r.characterId === cid) && !r.locked && !owned.has(r.id)) out.push({ kind: "relic", defId: r.id });
      return out;
    },
  },
};

export function list(name, ctx, args = {}) {
  const def = LISTS[name];
  if (!def) throw new Error(`unknown list: ${name}`);
  let out = [...def.base(ctx, args)];
  const providers = [];
  for (const src of activeSources(ctx.state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const l = mod.lists[name];
    if (!l) continue;
    providers.push({ order: l.order, registryIndex: registry.indexOf(mod), uid: uidOf(src), src: { ...src, module: mod }, provide: l.provide });
  }
  providers.sort((a, b) => a.order - b.order || a.registryIndex - b.registryIndex || a.uid - b.uid);
  for (const p of providers) {
    const r = p.provide(ctx, p.src, args, out);
    if (Array.isArray(r)) out = out.concat(r);
  }
  return out;
}

// placeholder 敵 (kind=placeholder, slot n) → 挑戦中 character の同 slot の characterUnique。該当が無ければマスタ不整合として例外
export function resolveEnemyPlaceholder(state, enemyId) {
  const def = master.get("enemies", enemyId);
  if (def.kind !== "placeholder") return enemyId;
  const hit = master.all("enemies").find((e) => e.kind === "characterUnique" && e.characterId === state.characterId && e.slot === def.slot);
  if (!hit)
    throw new Error(`enemies に characterId=${state.characterId} slot=${def.slot} の characterUnique が無い (placeholder ${enemyId} を解決できない)`);
  return hit.id;
}

export function resolveEventPlaceholder(state, eventId) {
  const def = master.get("events", eventId);
  if (def.kind !== "placeholder") return eventId;
  const hit = master.all("events").find((e) => e.kind !== "placeholder" && e.characterId === state.characterId && e.slot === def.slot);
  if (!hit)
    throw new Error(
      `events に characterId=${state.characterId} slot=${def.slot} のヒロイン固有イベントが無い (placeholder ${eventId} を解決できない)`,
    );
  return hit.id;
}

// インベントリの隣接 query (03 adjacent)
export function adjacent(state, entity) {
  const size = entitySize(entity);
  const left = state.inventory.entities.find((e) => e.uid !== entity.uid && e.pos + entitySize(e) === entity.pos) ?? null;
  const right = state.inventory.entities.find((e) => e.uid !== entity.uid && e.pos === entity.pos + size) ?? null;
  return { left, right, rightEmpty: right == null };
}
