// レリック: 毎バトル開始時シールド +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "battleStartShield",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "shield" },
  modifiers: {
    battleStartShield: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.battleStartShield", value: src.values[0] }) },
  },
});
