// 特殊衣装 1 (04): バトル 1 ターン目だけ enemyAttack -values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "costume",
  key: "special1",
  values: [{ name: "amount", type: "int", min: 0 }],
  text: { chip: "costume.special1" },
  modifiers: {
    enemyAttack: {
      stage: "flat",
      order: 400,
      apply: (ctx, src) => (ctx.state.battle?.turn === 1 ? { label: "costume.special1", value: -(src.def.values?.[0] ?? 0) } : null),
    },
  },
});
