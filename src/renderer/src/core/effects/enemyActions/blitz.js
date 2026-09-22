// 敵アクション blitz (マーカー): このターン敵が先攻。派生 turnOrder への寄与で表す (プレイヤー側の blitz は final で戻す)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "blitz",
  values: [],
  text: { shape: "blitz" },
  modifiers: {
    turnOrder: { stage: "flat", order: 100, apply: () => ({ label: "enemyAction.blitz", value: "enemy" }) },
  },
  use: (ctx) => {
    ctx.emit("enemyBlitz", {});
  },
});
