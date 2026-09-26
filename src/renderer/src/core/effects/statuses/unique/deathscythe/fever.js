// デスサイズちゃん固有バステ 2 体温上昇 (11): 付与時に衣装を full (完全クロスブレイク) にし、所持中は修復できない。
// 切れても衣装は full のまま (服を脱ぎ捨てたので)。衣装が変わった分は過酷さに数えない (statusHits で 1 回数え済み)
import { defineEffect } from "../../../define.js";

export default defineEffect({
  family: "status",
  key: "ds_fever",
  values: [],
  text: { chip: "ds_fever", sd: "unique_ds_fever" },
  onApply: (ctx, src, { target }) => {
    if (target !== "player") return;
    ctx.setCostume("full", "unique");
  },
  permissions: {
    canRepairCostume: { order: 200, check: (ctx, src) => (src.unique ? "fever" : null) },
  },
});
