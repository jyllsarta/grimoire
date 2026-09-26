// 選択肢の条件: 挑戦中 character が羽を持ち (characters.wings)、インベントリの占有マス数の合計が values[0] 以下 (怪しいプール「水溜まりを飛び越えた」)
import { defineEffect } from "../define.js";
import { entitySize } from "../../domain/entity.js";

export default defineEffect({
  family: "choiceCondition",
  key: "wingsAndInventoryAtMost",
  values: [{ name: "maxSize", type: "int", min: 0 }],
  text: { shape: "wings" },
  check: (ctx, src) => {
    const c = ctx.master.get("characters", ctx.state.characterId);
    if (!c.wings) return false;
    const occupied = ctx.state.inventory.entities.reduce((a, e) => a + entitySize(e), 0);
    return occupied <= src.values[0];
  },
});
