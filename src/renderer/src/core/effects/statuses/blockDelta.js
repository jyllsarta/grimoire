// バトルバフ blockDelta (04): player 側の blockValue に +value
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "blockDelta",
  values: [],
  text: { shape: "block", chip: "blockDelta" },
  modifiers: {
    blockValue: { stage: "flat", order: 350, apply: (ctx, src) => (src.side === "player" ? { label: "buff.blockDelta", value: src.value } : null) },
  },
});
