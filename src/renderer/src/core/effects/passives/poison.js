// 装備パッシブ poison: 攻撃時に敵へ毒 values[0] (フルブロックされても入る)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "passive",
  key: "poison",
  values: [{ name: "stack", type: "int", min: 1 }],
  text: { shape: "poison" },
  hooks: {
    "player.strike.after": {
      order: 400,
      run: (ctx, src) => {
        ctx.emit("poisonApply", { value: src.values[0] });
        ctx.applyStatus(ctx.state.battle.panelUid, "poison", src.values[0], { source: src });
      },
    },
  },
});
