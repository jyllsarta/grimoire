// run.start: newRun で state を作った直後、章を組む前
import { defineStep, std } from "../_define.js";
import { resetInventoryToStart } from "../../domain/inventory.js";

export default defineStep({
  name: "run.start",
  scope: "run",
  registrants: "star.startRelic (100)",
  standard: [
    std("initialize", 500, (ctx) => {
      const state = ctx.state;
      state.player.hp = ctx.derive("startHp");
      state.wallet.coin = ctx.derive("chapterCoin");
      resetInventoryToStart(ctx);
    }),
  ],
});
