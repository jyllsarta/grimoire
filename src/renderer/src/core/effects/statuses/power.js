// 良性ステート power (04): 派生 attackPower に +value (章のあいだ、減衰なし)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "power",
  values: [],
  text: { shape: "attack", chip: "power", polarity: "good" },
  modifiers: {
    attackPower: { stage: "flat", order: 300, apply: (ctx, src) => (src.side === "player" ? { label: "status.power", value: src.value } : null) },
  },
});
