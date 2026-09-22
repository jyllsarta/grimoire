// rerollPrice: ショップ引き直しの価格 (ジュエル)。base = config.rerollPrice。寄与: star.rerollCost+。下限 0
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({ name: "rerollPrice", kind: "number", base: () => master.config.rerollPrice, finalize: (v) => Math.max(0, v) });
