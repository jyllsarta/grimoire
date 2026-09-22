// アイテム: 敵ブロック無視の直接ダメージ values[0] (戦闘中のみ)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "item",
  key: "attack",
  values: [{ name: "damage", type: "int", min: 1 }],
  text: { shape: "attack" },
  use: (ctx, src) => {
    if (!ctx.state.battle) return false;
    ctx.damageEnemy(src.values[0], { ignoreBlock: true, tag: "item", source: src });
    return true;
  },
});
