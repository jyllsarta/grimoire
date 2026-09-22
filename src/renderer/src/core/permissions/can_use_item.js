// canUseItem({entity}): アイテムを使えるか。非戦闘では items.usableOutOfBattle のみ。寄与: item.executeAtMost (条件外), status.sleep
import { definePermission } from "./_define.js";
import { master } from "../master/index.js";

export default definePermission({
  name: "canUseItem",
  base: (ctx, { entity }) => {
    if (!entity || entity.kind !== "item") return "notItem";
    const def = master.get("items", entity.defId);
    if (!ctx.state.battle && !def.usableOutOfBattle) return "itemOnlyBattle";
    return null;
  },
});
