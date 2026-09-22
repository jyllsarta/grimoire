// イベント効果 status: value = statuses.id を量 1 で付与 (04 の付与規則を通る)。量を変えたいときは行を分ける
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "status",
  values: [{ name: "statusId", type: "int" }],
  refs: [{ index: 0, table: "statuses" }],
  text: { shape: "status" },
  use: (ctx, src, eff) => {
    const def = ctx.master.get("statuses", eff.value);
    ctx.applyStatus("player", def.key, 1, { source: src });
  },
});
