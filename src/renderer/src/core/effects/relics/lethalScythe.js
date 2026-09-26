// レリック リーサルサイズ (11): 行動 (通常攻撃 / アイテム / アビリティ) の後、敵の HP が 派生 lethalThreshold 以下なら倒す。
// base の閾値は values[0] (派生への寄与)。倒し方は damageEnemy(hp, 貫通) なので HP がちょうど 0 = ジャストリーサル扱い (enemy.killed の just)
import { defineEffect } from "../define.js";

function tryLethal(ctx, src) {
  const b = ctx.state.battle;
  const enemy = ctx.enemy();
  if (!b || !enemy || b.result || enemy.hp <= 0) return;
  const threshold = ctx.derive("lethalThreshold");
  if (enemy.hp > threshold) return;
  ctx.emit("lethalScythe", { hp: enemy.hp, threshold, defId: src.def.id });
  ctx.damageEnemy(enemy.hp, { ignoreBlock: true, pierceShield: true, tag: "lethal", source: src });
}

export default defineEffect({
  family: "relic",
  key: "lethalScythe",
  values: [{ name: "threshold", type: "int", min: 1 }],
  text: { shape: "lethal" },
  modifiers: {
    lethalThreshold: { stage: "flat", order: 100, apply: (ctx, src) => ({ label: "relic.lethalScythe", value: src.values[0] }) },
  },
  hooks: {
    "player.strike.after": { order: 450, run: tryLethal },
    "action.item": { order: 100, run: tryLethal },
    "action.ability": { order: 100, run: tryLethal },
  },
});
