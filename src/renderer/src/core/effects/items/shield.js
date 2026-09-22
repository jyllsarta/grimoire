// アイテム: このバトル中のシールド +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "item",
  key: "shield",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "shield" },
  use: (ctx, src) => {
    if (!ctx.state.battle) return false;
    ctx.state.battle.shield += src.values[0];
    ctx.emit("shieldGain", { amount: src.values[0] });
    return true;
  },
});
