// 全クロスブレイク (04): attackPower -1、enemyAttack +1 (ブロック計算の前)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "costume",
  key: "full",
  values: [],
  text: { chip: "costume.full" },
  modifiers: {
    attackPower: { stage: "flat", order: 400, apply: () => ({ label: "costume.full", value: -1 }) },
    enemyAttack: { stage: "flat", order: 400, apply: () => ({ label: "costume.full", value: 1 }) },
  },
});
