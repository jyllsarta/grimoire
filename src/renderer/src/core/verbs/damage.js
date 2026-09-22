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

// ブロック処理。通ったダメージを enemy.damageTaken に発生源つきで 1 件積む。ちょうど 0 で recharge(justLethal)。0 以下で result = victory
export function damageEnemy(ctx, n, { ignoreBlock = false, tag = "strike", source = null } = {}) {
  const state = ctx.state;
  const enemy = ctx.enemy();
  if (!enemy) throw new Error("damageEnemy: バトル中でない");
  const block = ignoreBlock ? 0 : enemy.block;
  const dmg = Math.max(0, n - block);
  const blocked = n - dmg;
  enemy.hp -= dmg;
  enemy.damageTaken.push({ tag, source: describeSource(source), amount: dmg, turn: state.battle.turn });
  ctx.emit("enemyDamage", { tag, dmg, blocked, source: describeSource(source) });
  if (blocked > 0 && !ignoreBlock) ctx.emit("enemyBlocked", { blocked });
  ctx.fire("enemy.damaged", { tag, dmg, blocked, source });
  if (enemy.hp === 0) ctx.recharge("justLethal", 1);
  if (enemy.hp <= 0) state.battle.result = "victory";
  return { dmg, blocked };
}
