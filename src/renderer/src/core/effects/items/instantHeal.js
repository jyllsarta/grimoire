// アイテム: ライフ +values[0]。回復が発生すると毒が消える (ctx.heal の規則)。非戦闘でも使える (items.usableOutOfBattle)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "item",
  key: "instantHeal",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "heal" },
  use: (ctx, src) => {
    ctx.heal(src.values[0], { source: src });
    return true;
  },
});
