// イベント効果 loseAllCoins: コインを全部失う (逆さ吊りトラップ「財布を落としちゃった」)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "loseAllCoins",
  values: [],
  text: { shape: "coin" },
  use: (ctx) => {
    const w = ctx.state.wallet;
    const lost = w.coin;
    w.coin = 0;
    ctx.emit("coinGain", { amount: -lost });
  },
});
