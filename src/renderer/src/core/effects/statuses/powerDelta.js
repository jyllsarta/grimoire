// バトルバフ powerDelta (04): player 側なら attackPower、enemy 側なら enemyAttack に +value (turns は自分側の行動の後に -1)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "powerDelta",
  values: [],
  text: { shape: "attack", chip: "powerDelta" },
  modifiers: {
    attackPower: { stage: "flat", order: 350, apply: (ctx, src) => (src.side === "player" ? { label: "buff.powerDelta", value: src.value } : null) },
    enemyAttack: { stage: "flat", order: 350, apply: (ctx, src) => (src.side === "enemy" ? { label: "buff.powerDelta", value: src.value } : null) },
  },
});
