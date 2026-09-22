// flee.command: にげる を押した直後。敵に 1 回自由行動される
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "flee.command",
  scope: "battle",
  next: () => "enemy.act.begin",
  registrants: "(なし)",
  standard: [
    std("command", 500, (ctx) => {
      const b = ctx.state.battle;
      b.started = true;
      b.turnMemo.fleeing = true;
      ctx.emit("fleeStart", {});
    }),
  ],
});
