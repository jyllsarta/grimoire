// 幕間のコマンド: buyShopSlot / rerollShop / buyHeal / enterNextChapter
import { makeShop, slotPrice } from "../domain/shop.js";

export const commands = {
  buyShopSlot: {
    phases: ["intermission"],
    run: (ctx, { index }) => {
      const state = ctx.state;
      const slot = state.shop.slots[index];
      if (!slot) return { ok: false, reason: "unknownSlot" };
      if (slot.soldOut) return { ok: false, reason: "soldOut" };
      const price = slotPrice(slot);
      if (state.wallet.jewel < price.jewel) return { ok: false, reason: "jewels" };
      if (state.wallet.crown < price.crown) return { ok: false, reason: "crowns" };
      if (slot.kind === "relic" && state.relics.some((r) => r.defId === slot.defId)) return { ok: false, reason: "alreadyOwned" };
      state.wallet.jewel -= price.jewel;
      state.wallet.crown -= price.crown;
      slot.soldOut = true;
      if (slot.kind === "relic") {
        ctx.gainRelic(slot.defId, { source: { family: "shop", key: "buy" } });
      } else {
        state.ownedPanels.push({ kind: slot.kind, defId: slot.defId });
        ctx.emit("panelBuy", { kind: slot.kind, defId: slot.defId });
      }
      return { ok: true };
    },
  },

  rerollShop: {
    phases: ["intermission"],
    run: (ctx) => {
      const price = ctx.derive("rerollPrice");
      if (ctx.state.wallet.jewel < price) return { ok: false, reason: "jewels" };
      ctx.state.wallet.jewel -= price;
      makeShop(ctx, { rerolls: ctx.state.shop.rerolls + 1 });
      ctx.emit("shopReroll", { price });
      return { ok: true };
    },
  },

  buyHeal: {
    phases: ["intermission"],
    run: (ctx) => {
      const state = ctx.state;
      const price = ctx.derive("healPrice");
      if (state.player.hp >= ctx.derive("maxHp")) return { ok: false, reason: "hpFull" };
      if (state.wallet.jewel < price) return { ok: false, reason: "jewels" };
      state.wallet.jewel -= price;
      ctx.heal(1, { source: { family: "shop", key: "heal" } });
      return { ok: true };
    },
  },

  enterNextChapter: {
    phases: ["intermission"],
    run: (ctx) => {
      const state = ctx.state;
      ctx.fire("intermission.leave");
      state.shop = null;
      state.progress.chapterIndex += 1;
      state.wallet.coin = ctx.derive("chapterCoin");
      ctx.fire("chapter.build");
      ctx.fire("chapter.start");
      return { ok: true, chapterIndex: state.progress.chapterIndex };
    },
  },
};
