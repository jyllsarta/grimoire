// enemy.stunned: スタン中の敵はこのルーチンを飛ばす (バフ・ステートの減衰とルーチン進行はする)。settle
import { defineStep, std } from "../_define.js";
import { tickBuffs, decayEnemyStatuses } from "../../domain/battle.js";
import { afterEnemyPhase } from "./_transitions.js";

export default defineStep({
  name: "enemy.stunned",
  scope: "battle",
  settle: true,
  next: (b) => afterEnemyPhase(b),
  registrants: "(なし)",
  standard: [
    std("unstun", 500, (ctx) => {
      ctx.enemy().stunned = false;
      ctx.emit("enemyStunned", {});
    }),
    std("enemyBuffsTick", 600, (ctx) => tickBuffs(ctx, ctx.enemy(), "enemy")),
    std("enemyStatusDecay", 650, (ctx) => decayEnemyStatuses(ctx)),
    std("routineAdvance", 700, (ctx) => {
      ctx.enemy().routineIndex += 1;
    }),
  ],
});
