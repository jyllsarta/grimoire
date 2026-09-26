// 良性ステート 回避 (11): 敵の通常攻撃 (enemyAction.attack) 1 発を無効化する。value = 残りの回数 (減衰なし、章のあいだ残る)。
// enemy.attack.before で 1 スタック消費して payload.negated = true。1 ターンに複数回攻撃されたら 2 発目以降は被弾する
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "evade",
  values: [],
  text: { shape: "evade", chip: "evade", polarity: "good" },
  hooks: {
    "enemy.attack.before": {
      order: 100,
      when: (ctx, src, payload) => src.side === "player" && !payload.negated,
      run: (ctx, src, payload) => {
        payload.negated = true;
        ctx.emit("evade", { remaining: src.value - 1 });
        ctx.removeStatus("player", src.statusKey, { amount: 1, cause: "evade" });
      },
    },
  },
});
