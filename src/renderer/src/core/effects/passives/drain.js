// 装備パッシブ drain: 与えたダメージ × 倍率ぶん回復 (実回復 1 以上なら毒も消える = ctx.heal の規則)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "passive",
  key: "drain",
  values: [{ name: "multiplier", type: "int", min: 1 }],
  text: { shape: "heal" },
  hooks: {
    "player.strike.after": {
      order: 300,
      when: (ctx) => (ctx.state.battle?.turnMemo.lastStrikeDmg ?? 0) > 0,
      run: (ctx, src) => {
        const amount = ctx.state.battle.turnMemo.lastStrikeDmg * src.values[0];
        ctx.emit("drainHeal", { amount });
        ctx.heal(amount, { source: src });
      },
    },
  },
});
