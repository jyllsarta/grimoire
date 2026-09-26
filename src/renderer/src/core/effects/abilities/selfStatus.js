// アビリティ: 自分にステート values[0] (statuses.id) を values[1] だけ付与 (04 の付与規則を通る)。クイックムーブ (回避)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "ability",
  key: "selfStatus",
  values: [
    { name: "statusId", type: "int" },
    { name: "amount", type: "int", min: 1 },
  ],
  refs: [{ index: 0, table: "statuses" }],
  text: { shape: "status" },
  use: (ctx, src) => {
    const def = ctx.master.get("statuses", src.values[0]);
    ctx.applyStatus("player", def.key, src.values[1], { source: src });
    return true;
  },
});
