// turn.command: attack を押した直後。started=true。眠りなら手番スキップを予約
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "turn.command",
  scope: "battle",
  next: () => "player.tick",
  registrants: "passive.powerEqualsHpAtCommand (100: memo に HP を保存)",
  standard: [
    std("command", 500, (ctx) => {
      const b = ctx.state.battle;
      b.started = true;
      if (!ctx.permission("canAct").ok) b.turnMemo.skipPlayer = true;
    }),
  ],
});
