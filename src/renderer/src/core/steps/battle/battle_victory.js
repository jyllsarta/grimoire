// battle.victory: 報酬 → リチャージ (kill / turn) → 盤面更新 (ボスなら chapterClear 化、そうでなければ落下・補充)
import { defineStep, std } from "../_define.js";
import { removePanel, turnIntoChapterClear } from "../../domain/board.js";

export default defineStep({
  name: "battle.victory",
  scope: "battle",
  next: () => "battle.end",
  registrants: "relic.healOnKill (400)",
  standard: [
    std("reward", 100, (ctx) => {
      const panel = ctx.enemyPanel();
      const coin = ctx.derive("killReward", { defId: panel.defId });
      ctx.state.wallet.coin += coin;
      ctx.emit("victory", { coin, uid: panel.uid, isBoss: panel.isBoss });
    }),
    std("rechargeKill", 200, (ctx) => ctx.recharge("kill", 1)),
    std("rechargeTurn", 300, (ctx) => ctx.recharge("turn", 1)),
    std("boardUpdate", 500, (ctx) => {
      const state = ctx.state;
      const panel = ctx.enemyPanel();
      state.counters.kills += 1;
      if (panel.isBoss) turnIntoChapterClear(ctx, panel.uid);
      else removePanel(ctx, state.board.cells.indexOf(panel.uid));
    }),
  ],
});
