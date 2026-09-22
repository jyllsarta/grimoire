// 発情 (04): permission canUseAbility 不許可 (リチャージは進む)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "arousal",
  values: [],
  text: { shape: "arousal", chip: "arousal" },
  permissions: {
    canUseAbility: { order: 200, check: (ctx, src) => (src.side === "player" ? "arousal" : null) },
  },
});
