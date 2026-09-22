// レリック: インベントリ +values[0] マス (上限は config.maxSlots)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "slotPlus",
  values: [{ name: "slots", type: "int", min: 1 }],
  text: { shape: "slot" },
  modifiers: {
    slotCount: { stage: "flat", order: 300, apply: (ctx, src) => ({ label: "relic.slotPlus", value: src.values[0] }) },
  },
});
