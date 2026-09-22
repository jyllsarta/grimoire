// レリック: 基礎こうげき +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "basePowerPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "attack" },
  modifiers: {
    basePower: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.basePowerPlus", value: src.values[0] }) },
  },
});
