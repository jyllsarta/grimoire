// 半クロスブレイク (04): attackPower -1。unique 中はマスク (sources が masked にする)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "costume",
  key: "half",
  values: [],
  text: { chip: "costume.half" },
  modifiers: {
    attackPower: { stage: "flat", order: 400, apply: () => ({ label: "costume.half", value: -1 }) },
  },
});
