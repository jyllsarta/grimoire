// player.act.skipped: 眠りで手番をスキップした
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "player.act.skipped",
  scope: "battle",
  next: () => "player.act.end",
  registrants: "(なし)",
  standard: [std("sleepSkip", 500, (ctx) => ctx.emit("sleepSkip", {}))],
});
