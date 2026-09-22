// chapter.build: 章の山札を組む
import { defineStep, std } from "../_define.js";
import { buildBoard } from "../../domain/board.js";
import { currentChapterId } from "../../domain/chapter.js";

export default defineStep({
  name: "chapter.build",
  scope: "run",
  registrants: "star.initial* / star.chapterEnemy、bookRule (specs への寄与は派生リスト chapterPanelSpecs で)",
  standard: [
    std("buildBoard", 500, (ctx) => {
      buildBoard(ctx, currentChapterId(ctx.state));
      ctx.emit("chapterBuild", { chapterId: ctx.state.board.chapterId });
    }),
  ],
});
