// イベント効果 hp: ライフ ± (減少は damagePlayer tag=event)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "hp",
  values: [{ name: "amount", type: "int" }],
  text: { shape: "life" },
  use: (ctx, src, eff) => {
    const v = eff.value ?? 0;
    if (v >= 0) ctx.heal(v, { source: src });
    else ctx.damagePlayer(-v, { tag: "event", source: src });
  },
});
