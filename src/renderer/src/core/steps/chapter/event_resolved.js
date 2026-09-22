// event.resolved: イベントの選択肢の効果を適用した後 (payload: { event, choice, misfortune })
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "event.resolved",
  scope: "run",
  registrants: "(なし)",
  standard: [
    std("harshness", 500, (ctx, src, payload) => {
      if (!payload?.misfortune) return;
      ctx.state.counters.harshness.misfortunes += 1;
      ctx.emit("harshnessGain", { kind: "misfortune" });
    }),
  ],
});
