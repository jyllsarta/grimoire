// battleStartShield: battle.start のシールド。base = 0。寄与: relic.battleStartShield。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "battleStartShield", kind: "number", base: () => 0, finalize: (v) => Math.max(0, v) });
