// レリック: 毎バトル開始時、自分にステート values[0] (statuses.id) を values[1] だけ付与 (04 の付与規則を通る)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "battleStartStatus",
  values: [
    { name: "statusId", type: "int" },
    { name: "amount", type: "int", min: 1 },
  ],
  refs: [{ index: 0, table: "statuses" }],
  text: { shape: "status" },
  hooks: {
    "battle.start": {
      order: 600,
      run: (ctx, src) => {
        const def = ctx.master.get("statuses", src.values[0]);
        ctx.emit("relicProc", { defId: src.def.id });
        ctx.applyStatus("player", def.key, src.values[1], { source: src });
      },
    },
  },
});
