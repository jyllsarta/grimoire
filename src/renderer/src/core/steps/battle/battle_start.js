// battle.start: startBattle の直後。シールド・ターン・統計
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "battle.start",
  scope: "battle",
  next: () => "turn.start",
  registrants: "relic.battleStartShield (派生 battleStartShield への寄与)",
  standard: [
    std("create", 500, (ctx) => {
      const b = ctx.state.battle;
      b.shield = ctx.derive("battleStartShield");
      b.turn = 1;
      ctx.state.counters.battles += 1;
      ctx.emit("battleStart", { panelUid: b.panelUid, shield: b.shield });
    }),
  ],
});
