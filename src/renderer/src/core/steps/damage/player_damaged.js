// player.damaged: 動詞 damagePlayer が発火 (payload: { tag, dmg, hpLoss, absorbed, source })
import { defineStep } from "../_define.js";

export default defineStep({ name: "player.damaged", scope: "run", registrants: "status.sleep (tag=enemyAttack かつ dmg ≥ 1 で解除)" });
