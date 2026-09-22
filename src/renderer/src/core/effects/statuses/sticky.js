// ねばねば (04): 派生 turnOrder を enemy に (プレイヤー側の blitz 武器で打ち消せる = passive.blitz が final で player に戻す)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "sticky",
  values: [],
  text: { shape: "sticky", chip: "sticky" },
  modifiers: {
    turnOrder: { stage: "flat", order: 200, apply: (ctx, src) => (src.side === "player" ? { label: "status.sticky", value: "enemy" } : null) },
  },
});
