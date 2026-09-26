// アイテム: 貫通 values[0] ダメージ (敵のブロックもシールドも無視。戦闘中のみ)。クナイ
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "item",
  key: "pierceAttack",
  values: [{ name: "damage", type: "int", min: 1 }],
  text: { shape: "pierce" },
  use: (ctx, src) => {
    if (!ctx.state.battle) return false;
    ctx.damageEnemy(src.values[0], { ignoreBlock: true, pierceShield: true, tag: "item", source: src });
    return true;
  },
});
