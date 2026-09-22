// enemyAttack(action): 敵の 1 発。base = action.value。寄与: enemy buff.powerDelta, costume.full (+1), costume.special1 (turn 1 で -4), unique statuses。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "enemyAttack", kind: "number", base: (ctx, args) => args.action.value ?? 0, finalize: (v) => Math.max(0, v) });
