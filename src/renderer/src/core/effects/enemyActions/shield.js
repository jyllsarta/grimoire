// 敵アクション shield: 自分のシールド +value。シールドは HP と同じくバトルをまたいで残り、貫通でない攻撃を HP より先に受け止める (11)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "shield",
  values: [{ name: "shield", type: "int", min: 0 }],
  text: { shape: "shield" },
  use: (ctx, src, action) => {
    ctx.enemy().shield += action.value ?? 0;
    ctx.emit("enemyShield", { value: action.value ?? 0, shield: ctx.enemy().shield });
  },
});
