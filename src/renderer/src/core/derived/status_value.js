// statusValue: ステート付与量 (04 付与規則 2)。base = 付与しようとした量。寄与: star.badDurationPlus (bad かつ player 側)。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "statusValue", kind: "number", base: (ctx, args) => args.value, finalize: (v) => Math.max(0, v) });
