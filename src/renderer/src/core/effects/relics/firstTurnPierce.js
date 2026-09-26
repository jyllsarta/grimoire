// レリック: バトル 1 ターン目の通常攻撃に貫通 (strikeFlags pierce = ブロックとシールドを無視)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "firstTurnPierce",
  values: [],
  text: { shape: "pierce" },
  modifiers: {
    strikeFlags: {
      stage: "flat",
      order: 300,
      apply: (ctx) => (ctx.state.battle?.turn === 1 ? { label: "relic.firstTurnPierce", value: "pierce" } : null),
    },
  },
});
