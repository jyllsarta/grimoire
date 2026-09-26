// イベント効果 harshness: 過酷さ +value (重みを掛けない直接加算。counters.harshness.bonus)。怪しいプールの媚薬沼
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "harshness",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "harshness" },
  use: (ctx, src, eff) => {
    ctx.state.counters.harshness.bonus += eff.value ?? 1;
    ctx.emit("harshnessGain", { kind: "bonus", amount: eff.value ?? 1 });
  },
});
