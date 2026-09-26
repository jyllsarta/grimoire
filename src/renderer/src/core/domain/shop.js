// 幕間のショップ (02 shop)。枠配分はプロト踏襲 (R3 Q18):
//   章クリア直後: その他 (装備 / アイテム / アビリティ / 不利イベント) config.shopOtherSlots + レリック config.shopRelicSlots + レア config.shopRareSlots
//   引き直し:     その他 shopOtherSlots + レリック (shopRelicSlots + shopRareSlots)。レア枠は無い
// 候補は派生リスト shopCandidates (均等抽選)。レリックは rarity で重み付け (定数はここ。不変のグローバルな値はコードで持つ)
import { master } from "../master/index.js";
import { list } from "../lists/index.js";
import { defOf } from "./entity.js";

// 通常レリック枠: rarity 1 / 2 / 3 の重み。レア枠: rarity 2 / 3 の重み (★2 以上保証)
export const RARITY_WEIGHTS = { 1: 70, 2: 25, 3: 5 };
export const RARE_WEIGHTS = { 2: 95, 3: 5 };

function weightedPick(ctx, pool, weights) {
  const weighted = pool.map((c) => ({ c, w: weights[defOf("relic", c.defId).rarity ?? 1] ?? 0 })).filter((x) => x.w > 0);
  if (weighted.length === 0) return null;
  const total = weighted.reduce((a, x) => a + x.w, 0);
  let r = ctx.rand(total);
  for (const x of weighted) {
    r -= x.w;
    if (r < 0) return x.c;
  }
  return weighted[weighted.length - 1].c;
}

export function makeShop(ctx, { rerolls = 0 } = {}) {
  const cfg = master.config;
  const candidates = list("shopCandidates", ctx);
  const others = candidates.filter((c) => c.kind !== "relic");
  let relics = candidates.filter((c) => c.kind === "relic");
  const slots = [];
  const push = (c, rare) => slots.push({ kind: c.kind, defId: c.defId, soldOut: false, rare });

  for (let i = 0; i < cfg.shopOtherSlots && others.length > 0; i++) push(ctx.pick(others), false);

  const relicSlots = rerolls > 0 ? cfg.shopRelicSlots + cfg.shopRareSlots : cfg.shopRelicSlots;
  for (let i = 0; i < relicSlots; i++) {
    const c = weightedPick(ctx, relics, RARITY_WEIGHTS);
    if (!c) break;
    relics = relics.filter((r) => r.defId !== c.defId);
    push(c, false);
  }
  if (rerolls === 0) {
    for (let i = 0; i < cfg.shopRareSlots; i++) {
      const c = weightedPick(ctx, relics, RARE_WEIGHTS);
      if (!c) break;
      relics = relics.filter((r) => r.defId !== c.defId);
      push(c, true);
    }
  }
  ctx.state.shop = { slots, rerolls };
  return ctx.state.shop;
}

export function slotPrice(slot) {
  const def = defOf(slot.kind, slot.defId);
  return { jewel: def.price ?? 0, crown: slot.kind === "relic" ? (def.crownPrice ?? 0) : 0 };
}
