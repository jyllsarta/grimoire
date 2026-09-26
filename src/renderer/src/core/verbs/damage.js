// 動詞: damagePlayer / damageEnemy (03「ctx の動詞」)。横断規則はここに 1 回だけ書く
import { describeSource } from "./_source.js";

// シールドを先に削る (pierceShield なら貫通)。実際にライフが減った分だけ damageTakenThisTurn と recharge(damageTaken) を進める。
// 0 以下で battle.result = defeat (ステップは settle が変える)。バトル外なら ending = lose
export function damagePlayer(ctx, n, { tag = "enemyAttack", pierceShield = false, source = null } = {}) {
  const state = ctx.state;
  const p = state.player;
  const b = state.battle;
  let remaining = Math.max(0, n);
  let absorbed = 0;
  if (b && !pierceShield && b.shield > 0) {
    absorbed = Math.min(b.shield, remaining);
    b.shield -= absorbed;
    remaining -= absorbed;
  }
  const hpLoss = Math.min(p.hp, remaining);
  p.hp -= hpLoss;
  if (b) b.turnMemo.damageTakenThisTurn = (b.turnMemo.damageTakenThisTurn || 0) + hpLoss;
  if (hpLoss > 0) ctx.recharge("damageTaken", hpLoss);
  ctx.emit("playerDamage", { tag, dmg: n, hpLoss, absorbed, source: describeSource(source) });
  ctx.fire("player.damaged", { tag, dmg: n, hpLoss, absorbed, source });
  if (p.hp <= 0) {
    if (b) b.result = "defeat";
    else if (state.progress.ending == null) {
      state.progress.ending = "lose";
      ctx.fire("run.end", { ending: "lose" });
    }
  }
  return { hpLoss, absorbed };
}

// 敵へのダメージ。ブロック (ignoreBlock で無視) → シールド (pierceShield で無視) → HP の順に削る。
// 通ったダメージを enemy.damageTaken に発生源つきで 1 件積む。HP が 0 以下になった瞬間に 1 回だけ enemy.killed を発火
// (ちょうど 0 なら just = ジャストリーサル)。0 以下で result = victory
export function damageEnemy(ctx, n, { ignoreBlock = false, pierceShield = false, tag = "strike", source = null } = {}) {
  const state = ctx.state;
  const enemy = ctx.enemy();
  if (!enemy) throw new Error("damageEnemy: バトル中でない");
  const block = ignoreBlock ? 0 : enemy.block;
  let remaining = Math.max(0, n - block);
  const blocked = Math.max(0, n) - remaining;
  let absorbed = 0;
  if (!pierceShield && enemy.shield > 0) {
    absorbed = Math.min(enemy.shield, remaining);
    enemy.shield -= absorbed;
    remaining -= absorbed;
  }
  const dmg = remaining;
  const before = enemy.hp;
  enemy.hp -= dmg;
  enemy.damageTaken.push({ tag, source: describeSource(source), amount: dmg, turn: state.battle.turn });
  ctx.emit("enemyDamage", { tag, dmg, blocked, absorbed, source: describeSource(source) });
  if (blocked > 0 && !ignoreBlock) ctx.emit("enemyBlocked", { blocked });
  if (absorbed > 0) ctx.emit("enemyShieldAbsorb", { absorbed, shield: enemy.shield });
  ctx.fire("enemy.damaged", { tag, dmg, blocked, absorbed, source });
  if (before > 0 && enemy.hp <= 0) {
    state.battle.result = "victory";
    ctx.fire("enemy.killed", { just: enemy.hp === 0, tag, source });
  }
  return { dmg, blocked, absorbed };
}
