// 敵から受ける bad ステートの量 +values[0] (04 付与規則 2)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "star",
  key: "badDurationPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "status", sign: +1 },
  modifiers: {
    statusValue: {
      stage: "flat",
      order: 200,
      apply: (ctx, src, { target }) => (target === "player" ? { label: "star.badDurationPlus", value: src.values[0] } : null),
    },
  },
});
