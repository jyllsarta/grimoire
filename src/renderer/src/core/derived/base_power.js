// basePower: 素手の攻撃力。base = characters.power。寄与: relic.basePowerPlus, star.power±。下限 0
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "basePower",
  kind: "number",
  base: (ctx) => master.get("characters", ctx.state.characterId).power,
  finalize: (v) => Math.max(0, v),
});
