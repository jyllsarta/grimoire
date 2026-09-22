// バトル (02 battle)。開始と、result による次ステップの差し替え (settle)、減衰の共通処理
import { master } from "../master/index.js";
import { registry } from "../effects/index.js";

export function createBattle(panelUid) {
  return {
    panelUid,
    step: "battle.start",
    cursor: 0,
    turn: 1,
    started: false,
    result: null,
    shield: 0,
    buffs: [],
    delayed: [],
    turnMemo: {},
    memo: {},
  };
}

// result が立っていれば battle.victory / battle.defeat へ差し替える (残りの経路は捨てる)。flee は flee.done が自分で進める
export function settleStep(battle, next) {
  if (!battle.result) return next;
  if (battle.result === "victory") return "battle.victory";
  if (battle.result === "defeat") return "battle.defeat";
  return next;
}

// バフの turns を -1 して 0 で消す
export function tickBuffs(ctx, holder, side) {
  const before = holder.buffs.length;
  for (const b of holder.buffs) b.turns -= 1;
  holder.buffs = holder.buffs.filter((b) => b.turns > 0);
  if (holder.buffs.length !== before) ctx.emit("buffExpire", { side });
}

// 共通ステート (stack / turn) を -1 して 0 で消し、onExpire を呼ぶ。permanent は減らない
export function decayStatuses(ctx, holder, side, { skipKeys = [] } = {}) {
  const expired = [];
  for (const s of holder.statuses) {
    const def = master.byKey("statuses", s.key);
    if (def.duration === "permanent" || skipKeys.includes(s.key)) continue;
    s.value -= 1;
    if (s.value <= 0) expired.push(s.key);
  }
  if (expired.length === 0) return;
  holder.statuses = holder.statuses.filter((s) => s.value > 0);
  for (const key of expired) {
    const def = master.byKey("statuses", key);
    registry.find("status", def.effect || def.key)?.onExpire?.(ctx, { family: "status", key: def.effect || def.key, statusKey: key, def, side });
    ctx.emit("statusExpire", { side, key });
  }
}

// 固有バステの turns を -1 して 0 で消す
export function decayUnique(ctx) {
  const u = ctx.state.player.unique;
  if (!u) return;
  u.turns -= 1;
  if (u.turns > 0) return;
  const def = master.byKey("statuses", u.key);
  ctx.state.player.unique = null;
  registry
    .find("status", def.effect || def.key)
    ?.onExpire?.(ctx, { family: "status", key: def.effect || def.key, statusKey: u.key, def, side: "player", unique: true });
  ctx.emit("uniqueExpire", { key: u.key });
}
