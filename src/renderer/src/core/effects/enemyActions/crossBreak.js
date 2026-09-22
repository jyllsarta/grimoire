// 敵アクション crossBreak: 衣装状態を進める (04 のオートマトン。unique 中は何も起きない)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "crossBreak",
  values: [],
  text: { shape: "crossBreak" },
  use: (ctx) => {
    ctx.crossBreak();
  },
});
