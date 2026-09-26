// 本のルール: ジャストリーサル (enemy.killed で just) したら自分にステート values[0] (statuses.id) を values[1] だけ付与。デスサイズちゃんの本 (好調)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "bookRule",
  key: "statusOnJustLethal",
  values: [
    { name: "statusId", type: "int" },
    { name: "amount", type: "int", min: 1 },
  ],
  refs: [{ index: 0, table: "statuses" }],
  text: { icon: "statusOnJustLethal" },
  hooks: {
    "enemy.killed": {
      order: 300,
      when: (ctx, src, payload) => payload.just === true,
      run: (ctx, src) => {
        const def = ctx.master.get("statuses", src.values[0]);
        ctx.emit("bookRuleProc", { key: src.key });
        ctx.applyStatus("player", def.key, src.values[1], { source: src });
      },
    },
  },
});
