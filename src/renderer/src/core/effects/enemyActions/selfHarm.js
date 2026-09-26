// 敵アクション selfHarm: 自傷。自滅したら通常撃破扱い
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "selfHarm",
  values: [{ name: "damage", type: "int", min: 1 }],
  text: { shape: "selfHarm" },
  use: (ctx, src, action) => {
    ctx.emit("enemySelfHarm", { value: action.value });
    ctx.damageEnemy(action.value ?? 0, { ignoreBlock: true, pierceShield: true, tag: "self", source: src });
  },
});
