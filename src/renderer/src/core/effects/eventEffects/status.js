// イベント効果 status: value = statuses.id を value2 の量 (省略時 1) で付与 (04 の付与規則を通る。R3 Q12)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "status",
  values: [
    { name: "statusId", type: "int" },
    { name: "amount", type: "int", min: 1 },
  ],
  refs: [{ index: 0, table: "statuses" }],
  text: { shape: "status" },
  use: (ctx, src, eff) => {
    const def = ctx.master.get("statuses", eff.value);
    ctx.applyStatus("player", def.key, eff.value2 ?? 1, { source: src });
  },
});
