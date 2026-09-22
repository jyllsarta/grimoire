// abilityDamage: アビリティ由来ダメージへの加算。寄与: status.abilityDamage (良性ステート)。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "abilityDamage", kind: "number", base: () => 0, finalize: (v) => Math.max(0, v) });
