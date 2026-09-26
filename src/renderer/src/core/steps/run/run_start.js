// run.start: newRun で state を作った直後、章を組む前。初期レリック (characters.startRelicIds → star.startRelic) → hp → coin → インベントリ
import { defineStep, std } from "../_define.js";
import { resetInventoryToStart } from "../../domain/inventory.js";

export default defineStep({
  name: "run.start",
  scope: "run",
  registrants: "star.startRelic (450)",
  standard: [
    std("startRelics", 400, (ctx) => {
      const c = ctx.master.get("characters", ctx.state.characterId);
      for (const id of c.startRelicIds || []) ctx.gainRelic(id, { source: { family: "standard", key: "start" } });
    }),
    std("initialize", 500, (ctx) => {
      const state = ctx.state;
      state.player.hp = ctx.derive("startHp");
      state.wallet.coin = ctx.derive("chapterCoin");
      resetInventoryToStart(ctx);
    }),
  ],
});
