// 良性ステート abilityDamage (04): アビリティ由来ダメージに +value
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "abilityDamage",
  values: [],
  text: { shape: "ability", chip: "abilityDamage", polarity: "good" },
  modifiers: {
    abilityDamage: {
      stage: "flat",
      order: 300,
      apply: (ctx, src) => (src.side === "player" ? { label: "status.abilityDamage", value: src.value } : null),
    },
  },
});
