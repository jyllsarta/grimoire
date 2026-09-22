// panelCost({def, panel}): 盤面パネルの回収価格 (コイン)。base = def.cost。寄与: bookRule.weaponCostPlus 等。下限 0
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "panelCost", kind: "number", base: (ctx, args) => args.def.cost ?? 0, finalize: (v) => Math.max(0, v) });
