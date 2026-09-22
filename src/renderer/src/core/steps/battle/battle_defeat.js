// battle.defeat: ending = lose
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "battle.defeat",
  scope: "battle",
  next: () => "battle.end",
  registrants: "(なし)",
  standard: [
    std("lose", 500, (ctx) => {
      ctx.state.progress.ending = "lose";
      ctx.emit("defeat", {});
      ctx.fire("run.end", { ending: "lose" });
    }),
  ],
});
