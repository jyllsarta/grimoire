// maxHp: 最大ライフ。base = characters.hp。寄与: relic.maxHpPlus, star.maxHp±。下限 1
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "maxHp",
  kind: "number",
  base: (ctx) => master.get("characters", ctx.state.characterId).hp,
  finalize: (v) => Math.max(1, v),
});
