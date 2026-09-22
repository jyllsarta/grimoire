// 眠り (04): canAct 不許可 (手番スキップ)、フリーアクションも不可。敵の攻撃がブロックを抜けて 1 以上のダメージになったら解除
import { defineEffect } from "../define.js";

const denied = (ctx, src) => (src.side === "player" ? "sleep" : null);

export default defineEffect({
  family: "status",
  key: "sleep",
  values: [],
  text: { shape: "sleep", chip: "sleep", zzz: true },
  permissions: {
    canAct: { order: 100, check: denied },
    canActivateEquipment: { order: 100, check: denied },
    canUseAbility: { order: 100, check: denied },
    canUseItem: { order: 100, check: denied },
  },
  hooks: {
    "player.damaged": {
      order: 100,
      when: (ctx, src, payload) => src.side === "player" && payload.tag === "enemyAttack" && payload.dmg >= 1,
      run: (ctx, src) => {
        const p = ctx.state.player;
        if (!p.statuses.some((s) => s.key === src.statusKey)) return;
        p.statuses = p.statuses.filter((s) => s.key !== src.statusKey);
        ctx.emit("sleepCured", {});
        ctx.emit("statusExpire", { side: "player", key: src.statusKey });
      },
    },
  },
});
