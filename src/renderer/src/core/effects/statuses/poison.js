// 毒 (04): player.tick でスタック値ダメージ (ブロック・シールド貫通) → -1。回復で全消し。敵側は enemy.act.begin で同じ処理
import { defineEffect } from "../define.js";

function tick(ctx, src, holder, damage) {
  const entry = holder.statuses.find((s) => s.key === src.statusKey);
  if (!entry) return;
  damage(entry.value);
  entry.value -= 1;
  ctx.emit(src.side === "player" ? "playerPoisonTick" : "enemyPoisonTick", { value: entry.value + 1 });
  if (entry.value <= 0) {
    holder.statuses = holder.statuses.filter((s) => s.key !== src.statusKey);
    ctx.emit("statusExpire", { side: src.side, key: src.statusKey });
  }
}

export default defineEffect({
  family: "status",
  key: "poison",
  values: [],
  text: { shape: "poison", chip: "poison", face: "sick" },
  flags: { curedByHeal: true, decaysOnTick: true },
  hooks: {
    "player.tick": {
      order: 500,
      when: (ctx, src) => src.side === "player",
      run: (ctx, src) => tick(ctx, src, ctx.state.player, (n) => ctx.damagePlayer(n, { tag: "poison", pierceShield: true, source: src })),
    },
    "enemy.act.begin": {
      order: 600,
      when: (ctx, src) => src.side === "enemy",
      run: (ctx, src) => tick(ctx, src, ctx.enemy(), (n) => ctx.damageEnemy(n, { tag: "poison", ignoreBlock: true, source: src })),
    },
  },
});
