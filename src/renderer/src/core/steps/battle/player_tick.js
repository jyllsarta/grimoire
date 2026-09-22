// player.tick: プレイヤー側ステートの行動前 tick (毒はここ)。settle
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "player.tick",
  scope: "battle",
  settle: true,
  next: () => "turn.order",
  registrants: "status.poison (500)",
  standard: [std("statusTick", 500, () => {})],
});
