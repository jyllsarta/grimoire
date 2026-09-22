// 動詞: applyStatus (04 の付与規則) / addBuff
import { master } from "../master/index.js";
import { registry } from "../effects/index.js";

function statusModule(key) {
  const def = master.byKey("statuses", key);
  return registry.find(def.kind === "costume" ? "costume" : "status", def.effect || def.key);
}

// target は "player" か 敵の panelUid。付与できたら true
export function applyStatus(ctx, target, key, value, { source = null } = {}) {
  const state = ctx.state;
  const perm = ctx.permission("canApplyStatus", { target, key });
  if (!perm.ok) {
    ctx.emit("statusSkipped", { target, key, value, reason: perm.reason });
    return false;
  }
  const def = master.byKey("statuses", key);
  let amount = value;
  if (def.polarity === "bad") amount = ctx.derive("statusValue", { key, value, target });
  if (amount < 1) return false;
  const side = target === "player" ? "player" : "enemy";
  const src = { family: "status", key: def.effect || def.key, statusKey: key, def, side };
  if (def.kind === "unique") {
    // 上書き (別の固有バステでも同じでも)。上書き前の onExpire は呼ばない (置換であって消滅ではない)
    state.player.unique = { key, turns: amount };
    ctx.emit("uniqueApply", { key, turns: amount });
  } else {
    const holder = target === "player" ? state.player : state.board.panels[target].enemy;
    const existing = holder.statuses.find((s) => s.key === key);
    if (existing) {
      if (def.duration === "turn")
        existing.value = amount; // turn は上書き
      else existing.value += amount; // stack / permanent は加算
    } else {
      holder.statuses.push({ key, value: amount });
    }
    ctx.emit("statusApply", { target, key, value: amount, polarity: def.polarity });
  }
  statusModule(key)?.onApply?.(ctx, src, { target, value: amount });
  if (side === "player" && def.polarity === "bad") state.counters.harshness.statusHits += 1;
  return true;
}

// バトルバフ。同 key は加算 (stackable)、turns は最新で上書き。turns < 0 は「バトル中ずっと」
export function addBuff(ctx, side, key, value, turns) {
  const holder = side === "player" ? ctx.state.battle : ctx.enemy();
  if (!holder) throw new Error("addBuff: バトル中でない");
  const existing = holder.buffs.find((b) => b.key === key);
  if (existing) {
    existing.value += value;
    existing.turns = turns;
  } else {
    holder.buffs.push({ key, value, turns });
  }
  ctx.emit(side === "player" ? "selfBuff" : "enemyDebuff", { key, value, turns });
}
