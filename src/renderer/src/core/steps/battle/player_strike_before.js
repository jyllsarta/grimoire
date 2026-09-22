// player.strike.before: 一撃の直前 (登録用の空ステップ)
import { defineStep } from "../_define.js";

export default defineStep({ name: "player.strike.before", scope: "battle", next: () => "player.strike", registrants: "(なし)" });
