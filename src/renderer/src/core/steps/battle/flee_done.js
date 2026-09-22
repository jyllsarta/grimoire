// flee.done: 逃走の成立。result=flee を自分で立てて battle.end へ
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "flee.done",
  scope: "battle",
  next: () => "battle.end",
  registrants: "(なし)",
  standard: [
    std("done", 500, (ctx) => {
      ctx.state.battle.result = "flee";
      ctx.state.counters.flees += 1;
      ctx.emit("fleeDone", {});
    }),
  ],
});
