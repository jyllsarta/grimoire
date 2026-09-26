// レリック: 最大ライフ +values[0]。取得した瞬間に現在ライフも同じだけ増える (relic.gained、R3 Q15)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "maxHpPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "life" },
  modifiers: {
    maxHp: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.maxHpPlus", value: src.values[0] }) },
  },
  hooks: {
    "relic.gained": {
      order: 100,
      when: (ctx, src, payload) => payload.relic.uid === src.instance.uid,
      run: (ctx, src) => {
        ctx.heal(src.values[0], { source: src });
      },
    },
  },
});
