// 幕間のショップ (02 shop)。抽選規則はプロト踏襲の簡易版 (M1)。詳細な枠配分は M2 で 05 の config に寄せる
import { master } from "../master/index.js";
import { list } from "../timeline/derive.js";
import { defOf } from "./entity.js";

export function makeShop(ctx, { rerolls = 0 } = {}) {
  const candidates = list("shopCandidates", ctx);
  const slots = [];
  const usedRelics = new Set();
  const n = master.config.shopSlots;
  for (let i = 0; i < n && candidates.length > 0; i++) {
    const pool = candidates.filter((c) => c.kind !== "relic" || !usedRelics.has(c.defId));
    if (pool.length === 0) break;
    const c = ctx.pick(pool);
    if (c.kind === "relic") usedRelics.add(c.defId);
    const def = defOf(c.kind, c.defId);
    slots.push({ kind: c.kind, defId: c.defId, soldOut: false, rare: c.kind === "relic" && (def.rarity ?? 1) >= 2 });
  }
  ctx.state.shop = { slots, rerolls };
  return ctx.state.shop;
}

export function slotPrice(slot) {
  const def = defOf(slot.kind, slot.defId);
  return { jewel: def.price ?? 0, crown: slot.kind === "relic" ? (def.crownPrice ?? 0) : 0 };
}
