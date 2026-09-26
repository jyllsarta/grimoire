// 装備パッシブ: ON の間、リーサルサイズの発動対象 HP +values[0] (クリティカルナイフ。「この武器で攻撃するターン」= ON にしているターン)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "passive",
  key: "lethalThresholdPlus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "lethal" },
  modifiers: {
    lethalThreshold: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "passive.lethalThresholdPlus", value: src.values[0] }) },
  },
});
