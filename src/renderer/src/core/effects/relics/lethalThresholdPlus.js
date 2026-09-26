// レリック: リーサルサイズの発動対象 HP +values[0] (派生 lethalThreshold)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "lethalThresholdPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "lethal" },
  modifiers: {
    lethalThreshold: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.lethalThresholdPlus", value: src.values[0] }) },
  },
});
