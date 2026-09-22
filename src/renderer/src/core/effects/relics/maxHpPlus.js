// レリック: 最大ライフ +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "maxHpPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "life" },
  modifiers: {
    maxHp: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.maxHpPlus", value: src.values[0] }) },
  },
});
