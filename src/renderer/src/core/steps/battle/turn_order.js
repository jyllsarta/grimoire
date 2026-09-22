// turn.order: 先攻を決める (派生 turnOrder)。敵先攻ならイベント blitz
import { defineStep, std } from "../_define.js";
import { playerAction } from "./_transitions.js";

export default defineStep({
  name: "turn.order",
  scope: "battle",
  next: (b) => (b.turnMemo.order === "enemy" ? "enemy.act.begin" : playerAction(b)),
  registrants: "(派生 turnOrder への寄与: enemyAction.blitz、status.sticky、passive.blitz)",
  standard: [
    std("order", 500, (ctx) => {
      const b = ctx.state.battle;
      b.turnMemo.order = ctx.derive("turnOrder");
      if (b.turnMemo.order === "enemy") ctx.emit("blitz", {});
    }),
  ],
});
