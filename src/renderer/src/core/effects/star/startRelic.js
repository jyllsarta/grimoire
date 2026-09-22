// 初期レリック (run.start で所持。ショップの候補からは除外 = 所持済みなので shopCandidates が外す)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "star",
  key: "startRelic",
  values: [{ name: "relicId", type: "int" }],
  refs: [{ index: 0, table: "relics" }],
  text: { shape: "relic" },
  hooks: {
    "run.start": {
      order: 100,
      run: (ctx, src) => {
        const defId = src.values[0];
        ctx.master.get("relics", defId);
        if (ctx.state.relics.some((r) => r.defId === defId)) return;
        ctx.state.relics.push({ uid: ctx.uid(), defId, memo: {} });
        ctx.emit("relicGain", { defId, source: "star" });
      },
    },
  },
});
