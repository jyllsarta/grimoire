// イベント効果 coins: コイン ± (下限 0)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "coins",
  values: [{ name: "amount", type: "int" }],
  text: { shape: "coin" },
  use: (ctx, src, eff) => {
    const w = ctx.state.wallet;
    w.coin = Math.max(0, w.coin + (eff.value ?? 0));
    ctx.emit("coinGain", { amount: eff.value ?? 0 });
  },
});
