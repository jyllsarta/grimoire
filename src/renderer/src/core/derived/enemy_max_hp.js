// enemyMaxHp(defId): 敵の生成時ライフ。base = enemies.hp。寄与: star.enemyHp±。下限 1
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "enemyMaxHp",
  kind: "number",
  base: (ctx, args) => master.get("enemies", args.defId).hp,
  finalize: (v) => Math.max(1, v),
});
