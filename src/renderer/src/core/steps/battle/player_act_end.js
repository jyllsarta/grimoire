// player.act.end: プレイヤーの行動の後。ステートの減衰 (毒は player.tick で自分で減る) → バフの減衰。settle
import { defineStep, std } from "../_define.js";
import { tickBuffs, decayStatuses, decayUnique, tickDecayKeys } from "../../domain/battle.js";

export default defineStep({
  name: "player.act.end",
  scope: "battle",
  settle: true,
  next: (b) => (b.turnMemo.order === "player" ? "enemy.act.begin" : "turn.end"),
  registrants: "(なし)",
  standard: [
    std("statusDecay", 500, (ctx) => {
      decayStatuses(ctx, ctx.state.player, "player", { skipKeys: tickDecayKeys(ctx.state.player) });
      decayUnique(ctx);
    }),
    std("buffsTick", 600, (ctx) => tickBuffs(ctx, ctx.state.battle, "player")),
  ],
});
