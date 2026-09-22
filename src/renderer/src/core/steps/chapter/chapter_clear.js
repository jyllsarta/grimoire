// chapter.clear: 章クリアパネルを踏んだ直後。報酬 → リセット → 次を決める (幕間 / Extra / エンディング)
import { defineStep, std } from "../_define.js";
import { master } from "../../master/index.js";
import { resetInventoryToStart } from "../../domain/inventory.js";
import { makeShop } from "../../domain/shop.js";
import { isExtraChapter, isLastMainChapter } from "../../domain/chapter.js";

export default defineStep({
  name: "chapter.clear",
  scope: "run",
  registrants: "star.jewel± / crown± (派生 jewelGain / crownGain への寄与)",
  standard: [
    std("rewards", 500, (ctx) => {
      const state = ctx.state;
      const jewel = ctx.derive("jewelGain");
      const crown = ctx.derive("crownGain");
      state.wallet.jewel += jewel;
      state.wallet.crown += crown;
      state.star.crownsGained += crown;
      state.counters.chaptersCleared += 1;
      ctx.emit("rewards", { jewel, crown, coin: state.wallet.coin });
    }),
    std("reset", 600, (ctx) => {
      const state = ctx.state;
      state.wallet.coin = 0;
      state.player.statuses = [];
      state.player.unique = null;
      state.player.costume = "normal";
      resetInventoryToStart(ctx);
      ctx.emit("chapterClear", { chapterId: state.board.chapterId });
    }),
    std("decideNext", 700, (ctx) => {
      const state = ctx.state;
      if (isExtraChapter(state)) {
        state.progress.ending = "happy";
        ctx.fire("run.end", { ending: "happy" });
        return;
      }
      if (isLastMainChapter(state)) {
        const book = master.get("books", state.bookId);
        const score = ctx.derive("harshnessScore");
        if (book.extraChapterId != null && score >= book.harshnessThreshold) {
          state.progress.stage = "extra";
          ctx.emit("extraUnlocked", { score, threshold: book.harshnessThreshold });
        } else {
          state.progress.ending = "normal";
          ctx.fire("run.end", { ending: "normal" });
          return;
        }
      }
      makeShop(ctx);
      ctx.fire("intermission.enter");
    }),
  ],
});
