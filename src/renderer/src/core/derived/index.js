// ============================================================
// 派生値 (内訳付き)。ここは一覧と計算規則だけ。各値の base / クランプは 1 ファイルずつ。
// 寄与は効果モジュールの modifiers。stage (base → flat → mult → final) の順、同 stage 内は処理順の規則 (order → レジストリ順 → uid)。
// ============================================================
import { activeSources, moduleOf, uidOf } from "../effects/sources.js";
import { registry } from "../effects/index.js";

import maxHp from "./max_hp.js";
import startHp from "./start_hp.js";
import basePower from "./base_power.js";
import attackPower from "./attack_power.js";
import strikeFlags from "./strike_flags.js";
import enemyStrikeFlags from "./enemy_strike_flags.js";
import abilityDamage from "./ability_damage.js";
import statusValue from "./status_value.js";
import blockValue from "./block_value.js";
import enemyAttack from "./enemy_attack.js";
import enemyMaxHp from "./enemy_max_hp.js";
import turnOrder from "./turn_order.js";
import slotCount from "./slot_count.js";
import panelCost from "./panel_cost.js";
import killReward from "./kill_reward.js";
import chapterCoin from "./chapter_coin.js";
import jewelGain from "./jewel_gain.js";
import crownGain from "./crown_gain.js";
import healPrice from "./heal_price.js";
import rerollPrice from "./reroll_price.js";
import battleStartShield from "./battle_start_shield.js";
import harshnessScore from "./harshness_score.js";
import lethalThreshold from "./lethal_threshold.js";

const ALL = [
  maxHp,
  startHp,
  basePower,
  attackPower,
  strikeFlags,
  enemyStrikeFlags,
  abilityDamage,
  statusValue,
  blockValue,
  enemyAttack,
  enemyMaxHp,
  turnOrder,
  slotCount,
  panelCost,
  killReward,
  chapterCoin,
  jewelGain,
  crownGain,
  healPrice,
  rerollPrice,
  battleStartShield,
  harshnessScore,
  lethalThreshold,
];

export const DERIVED = Object.fromEntries(ALL.map((d) => [d.name, d]));
export const DERIVED_NAMES = ALL.map((d) => d.name);

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

export function describeSrc(src) {
  return { family: src.family, key: src.key, uid: src.instance?.uid ?? null, statusKey: src.statusKey ?? null, nodeId: src.nodeId ?? null };
}

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
    return { value: clamp(def, value, ctx, args, breakdown), breakdown };
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
  return { value: clamp(def, value, ctx, args, breakdown), breakdown };
}

function clamp(def, value, ctx, args, breakdown) {
  if (!def.finalize) return value;
  const fixed = def.finalize(value, ctx, args);
  if (fixed !== value) breakdown.push({ stage: "clamp", label: "clamp", value: fixed });
  return fixed;
}
