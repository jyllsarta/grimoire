// enemy.act.begin: 敵の行動の先頭。ブロックを 0 に戻し、敵側ステートの行動前 tick (毒)。settle
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "enemy.act.begin",
  scope: "battle",
  settle: true,
  next: (b, enemy, actions) => {
    if (enemy.stunned) return "enemy.stunned";
    if (!actions || actions.length === 0) return "enemy.act.after";
    return "enemy.action";
  },
  registrants: "status.poison (side=both、600)",
  standard: [
    std("blockReset", 500, (ctx) => {
      ctx.enemy().block = 0;
      ctx.emit("enemyRoutineStart", { routineIndex: ctx.enemy().routineIndex });
    }),
    std("enemyStatusTick", 600, () => {}),
  ],
});
