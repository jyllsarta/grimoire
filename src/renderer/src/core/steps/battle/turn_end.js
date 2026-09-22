// turn.end: ターンを進め、turnMemo を空にし、recharge(turn)
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "turn.end",
  scope: "battle",
  next: () => "turn.start",
  registrants: "relic.healEachTurn (300)",
  standard: [
    std("advance", 500, (ctx) => {
      const b = ctx.state.battle;
      b.turn += 1;
      b.turnMemo = {};
      ctx.state.counters.turns += 1;
    }),
    std("recharge", 600, (ctx) => ctx.recharge("turn", 1)),
  ],
});
