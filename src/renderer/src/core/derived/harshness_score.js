// harshnessScore: 過酷さ (04)。misfortunes × W1 + (statusHits + crossBreaks) × W2。Extra 判定と「本の要求」メーター
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "harshnessScore",
  kind: "number",
  base: (ctx) => {
    const h = ctx.state.counters.harshness;
    return h.misfortunes * master.config.harshnessWeightMisfortune + (h.statusHits + h.crossBreaks) * master.config.harshnessWeightStatus;
  },
});
