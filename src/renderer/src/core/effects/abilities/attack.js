// アビリティ: 敵ブロック無視の直接ダメージ values[0] (+ 良性ステート abilityDamage)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "ability",
  key: "attack",
  values: [{ name: "damage", type: "int", min: 1 }],
  text: { shape: "attack" },
  use: (ctx, src) => {
    const bonus = ctx.derive("abilityDamage");
    ctx.damageEnemy(src.values[0] + bonus, { ignoreBlock: true, tag: "ability", source: src });
    return true;
  },
});
