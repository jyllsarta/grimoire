// 敵アクション attack: 派生 enemyAttack と 派生 blockValue で 1 発。弾ごとにブロックをフル適用。
// 撃つ直前にステップ enemy.attack.before を発火し、negated にされた 1 発は無かったことになる (回避)。
// パリィ判定のために turnMemo に enemyAttacked / attacksBlocked / attackPassed を残す (enemy.act.after の標準処理 parry が読む)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "attack",
  values: [{ name: "damage", type: "int", min: 0 }],
  text: { shape: "attack" },
  use: (ctx, src, action) => {
    const b = ctx.state.battle;
    const payload = { action, negated: false };
    ctx.fire("enemy.attack.before", payload);
    if (payload.negated) {
      ctx.emit("enemyAttackNegated", { action });
      return;
    }
    const dmg = ctx.derive("enemyAttack", { action });
    const flags = ctx.derive("enemyStrikeFlags");
    const pierce = flags.includes("pierce");
    const block = pierce ? 0 : ctx.derive("blockValue");
    const passed = Math.max(0, dmg - block);
    b.turnMemo.enemyAttacked = true;
    if (pierce) b.turnMemo.pierced = true;
    if (block > 0 && passed === 0) b.turnMemo.attacksBlocked = true;
    if (passed > 0) b.turnMemo.attackPassed = true;
    ctx.emit("enemyAttack", { dmg, block, passed, pierce });
    ctx.damagePlayer(passed, { tag: "enemyAttack", source: src });
  },
});
