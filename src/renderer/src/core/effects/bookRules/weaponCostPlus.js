// 本のルール: 武器の回収コスト +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "bookRule",
  key: "weaponCostPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { icon: "weaponCostPlus" },
  modifiers: {
    panelCost: {
      stage: "flat",
      order: 300,
      apply: (ctx, src, { def }) => (def.category === "weapon" ? { label: "bookRule.weaponCostPlus", value: src.def.values[0] } : null),
    },
  },
});
