// killReward({defId}): 撃破コイン。base = enemies.reward。寄与: star.killCoin±。下限 0
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "killReward",
  kind: "number",
  base: (ctx, args) => master.get("enemies", args.defId).reward ?? 0,
  finalize: (v) => Math.max(0, v),
});
