// enemy.act.after: 敵の行動の後。防具摩耗 → パリィ判定 → 敵バフ / ステートの減衰 → ルーチン進行。settle
import { defineStep, std } from "../_define.js";
import { tickBuffs, decayEnemyStatuses } from "../../domain/battle.js";
import { activeArmors } from "../../domain/inventory.js";
import { afterEnemyPhase } from "./_transitions.js";

export default defineStep({
  name: "enemy.act.after",
  scope: "battle",
  settle: true,
  next: (b) => afterEnemyPhase(b),
  registrants: "passive.rechargeAllOnBlock (100)、relic.powerAfterParry (400)",
  standard: [
    std("armorWear", 200, (ctx) => {
      if (!ctx.state.battle.turnMemo.enemyAttacked) return;
      for (const a of activeArmors(ctx.state)) {
        ctx.emit("armorWear", { uid: a.uid });
        ctx.spend(a);
      }
    }),
    std("parry", 300, (ctx) => {
      const m = ctx.state.battle.turnMemo;
      if (m.enemyAttacked && m.attacksBlocked && !m.attackPassed && !m.pierced) {
        ctx.enemy().stunned = true;
        ctx.emit("parry", {});
      }
    }),
    std("enemyBuffsTick", 500, (ctx) => tickBuffs(ctx, ctx.enemy(), "enemy")),
    std("enemyStatusDecay", 550, (ctx) => decayEnemyStatuses(ctx)),
    std("routineAdvance", 600, (ctx) => {
      ctx.enemy().routineIndex += 1;
    }),
  ],
});
