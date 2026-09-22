// enemy.damaged: 動詞 damageEnemy が発火 (payload: { tag, dmg, blocked, source })
import { defineStep } from "../_define.js";

export default defineStep({ name: "enemy.damaged", scope: "run", registrants: "(なし)" });
