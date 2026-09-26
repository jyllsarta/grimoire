// 初期レリック (run.start で所持。characters.startRelicIds の後、hp を決める前。ショップの候補からは除外 = 所持済みなので shopCandidates が外す)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "star",
  key: "startRelic",
  values: [{ name: "relicId", type: "int" }],
  refs: [{ index: 0, table: "relics" }],
  text: { shape: "relic" },
  hooks: {
    "run.start": {
      order: 450,
      run: (ctx, src) => {
        ctx.gainRelic(src.values[0], { source: src });
      },
    },
  },
});
