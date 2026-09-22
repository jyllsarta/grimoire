// battle.end: 終端。予約を消して closeBattle を待つ
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "battle.end",
  scope: "battle",
  terminal: true,
  next: () => null,
  registrants: "bookRule.foodRot (戦闘数を進める)",
  standard: [
    std("clear", 500, (ctx) => {
      ctx.state.battle.delayed = [];
    }),
  ],
});
