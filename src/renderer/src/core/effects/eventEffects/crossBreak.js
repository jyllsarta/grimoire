// イベント効果 crossBreak: 衣装状態を進める
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "crossBreak",
  values: [],
  text: { shape: "crossBreak" },
  use: (ctx) => {
    ctx.crossBreak();
  },
});
