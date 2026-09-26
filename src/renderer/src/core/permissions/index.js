// 許可 (permission)。一覧と判定規則だけ。各許可の base は 1 ファイルずつ
import { activeSources, moduleOf, uidOf } from "../effects/sources.js";
import { registry } from "../effects/index.js";
import { describeSrc } from "../derived/index.js";

import canActivateEquipment from "./can_activate_equipment.js";
import canUseAbility from "./can_use_ability.js";
import canUseItem from "./can_use_item.js";
import canAct from "./can_act.js";
import canFlee from "./can_flee.js";
import canApplyStatus from "./can_apply_status.js";
import canRepairCostume from "./can_repair_costume.js";

const ALL = [canActivateEquipment, canUseAbility, canUseItem, canAct, canFlee, canApplyStatus, canRepairCostume];

export const PERMISSIONS = Object.fromEntries(ALL.map((p) => [p.name, p]));
export const PERMISSION_NAMES = ALL.map((p) => p.name);

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
