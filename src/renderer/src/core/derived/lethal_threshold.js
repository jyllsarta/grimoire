// lethalThreshold: リーサルサイズ (relic.lethalScythe) が「行動後に倒す」敵 HP の上限。base = 0 (レリックが無ければ発動しない)。
// 寄与: relic.lethalScythe (100: values[0])、relic.lethalThresholdPlus (300)、passive.lethalThresholdPlus (300: ON の武器)。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "lethalThreshold", kind: "number", base: () => 0, finalize: (v) => Math.max(0, v) });
