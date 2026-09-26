// スター: 章番号 values[1] (本の chapterIds の 1 始まり、Extra Chapter は chapterIds.length + 1) の山札に敵 values[0] を 1 体足す (R3 Q16)
import { defineEffect } from "../define.js";
import { chapterNumberOf } from "../../domain/chapter.js";
import { resolveEnemyPlaceholder } from "../../domain/placeholder.js";

export default defineEffect({
  family: "star",
  key: "chapterEnemy",
  values: [
    { name: "enemyId", type: "int" },
    { name: "chapterNo", type: "int", min: 1 },
  ],
  refs: [{ index: 0, table: "enemies" }],
  text: { shape: "enemy", sign: -1 },
  lists: {
    chapterPanelSpecs: {
      order: 200,
      provide: (ctx, src, { chapterId }) =>
        chapterNumberOf(ctx.state, chapterId) === src.values[1] ? [{ kind: "enemy", defId: resolveEnemyPlaceholder(ctx.state, src.values[0]) }] : [],
    },
  },
});
