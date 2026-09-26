// turn.start: ターンの先頭。予約 (delayed) を全部発動して空にする (turn ≥ 2)。予約の中身は積んだモジュールの fire (R3 Q6)
import { defineStep, std } from "../_define.js";
import { registry } from "../../effects/index.js";

export default defineStep({
  name: "turn.start",
  scope: "battle",
  next: () => "select",
  registrants: "status.confusion (100: 付与後最初の turn.start で 1 回だけ全装備 OFF)、ability.delayed* (delayed に積むのは使用時)",
  standard: [
    std("fireDelayed", 500, (ctx) => {
      const b = ctx.state.battle;
      ctx.emit("turnStart", { turn: b.turn });
      if (b.turn < 2 || b.delayed.length === 0) return;
      const delayed = b.delayed;
      b.delayed = [];
      for (const d of delayed) {
        const mod = registry.find(d.source?.family ?? "ability", d.key);
        if (!mod?.fire) throw new Error(`battle.delayed: ${d.source?.family ?? "ability"}.${d.key} に fire が無い`);
        ctx.emit("delayedFire", { key: d.key });
        mod.fire(ctx, d);
      }
    }),
  ],
});
