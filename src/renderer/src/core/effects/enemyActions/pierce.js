// 敵アクション pierce (マーカー): このルーチンの attack 全部がブロック不可 + パリィ不可。派生 enemyStrikeFlags への寄与で表す
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "pierce",
  values: [],
  text: { shape: "pierce" },
  modifiers: {
    enemyStrikeFlags: { stage: "flat", order: 200, apply: () => ({ label: "enemyAction.pierce", value: "pierce" }) },
  },
  use: (ctx) => {
    ctx.emit("enemyPierce", {});
  },
});
