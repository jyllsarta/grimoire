// アイテム: 衣装チェンジ。values[0] = statuses.id (kind=costume)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "item",
  key: "wearCostume",
  values: [{ name: "statusId", type: "int" }],
  refs: [{ index: 0, table: "statuses" }],
  text: { shape: "costume" },
  use: (ctx, src) => {
    const def = ctx.master.get("statuses", src.values[0]);
    if (def.kind !== "costume") throw new Error(`items ${src.def.id}: wearCostume の values[0]=${src.values[0]} が衣装でない`);
    ctx.setCostume(def.key, "item");
    return true;
  },
});
