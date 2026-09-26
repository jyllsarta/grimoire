// enemy.killed: 動詞 damageEnemy が敵の HP を 0 以下にした瞬間に 1 回だけ発火 (payload: { just, tag, source })。
// just = HP がちょうど 0 (ジャストリーサル)。標準処理は recharge(justLethal)。本のルール statusOnJustLethal はここに登録
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "enemy.killed",
  scope: "run",
  registrants: "bookRule.statusOnJustLethal (300)",
  standard: [
    std("justLethal", 500, (ctx, src, payload) => {
      if (!payload?.just) return;
      ctx.emit("justLethal", { tag: payload.tag });
      ctx.recharge("justLethal", 1);
    }),
  ],
});
