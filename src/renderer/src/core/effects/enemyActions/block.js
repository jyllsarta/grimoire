// 敵アクション block: このラウンドだけ自分にブロック (次の自分の行動開始で 0 に戻る)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "block",
  values: [{ name: "block", type: "int", min: 0 }],
  text: { shape: "block" },
  use: (ctx, src, action) => {
    ctx.enemy().block += action.value ?? 0;
    ctx.emit("enemyBlock", { value: action.value ?? 0 });
  },
});
