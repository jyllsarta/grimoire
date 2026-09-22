// レリック: 毎ターン終了時ライフ +values[0]
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "healEachTurn",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "heal" },
  hooks: {
    "turn.end": {
      order: 300,
      run: (ctx, src) => {
        ctx.emit("relicProc", { defId: src.def.id });
        ctx.heal(src.values[0], { source: src });
      },
    },
  },
});
