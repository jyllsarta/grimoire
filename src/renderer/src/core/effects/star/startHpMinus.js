// 1 章目開始時の現在ライフ -values[0] (最大ライフは減らない。下限 1 は派生 startHp の finalize)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "star",
  key: "startHpMinus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "life", sign: -1 },
  modifiers: {
    startHp: { stage: "final", order: 200, apply: (ctx, src) => ({ label: "star.startHpMinus", value: -src.values[0] }) },
  },
});
