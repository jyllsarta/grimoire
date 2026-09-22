// 敵アクション rest: なにもしない (値は読み飛ばす)。tale の "sleep" に相当。
// statuses.key の "sleep" (眠り付与) と衝突するので、行動名は rest にした (03 の enemyAction キー一覧の設計メモ)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "enemyAction",
  key: "rest",
  values: [],
  text: { shape: "rest" },
  use: (ctx) => {
    ctx.emit("enemyRest", {});
  },
});
