// select: 入力待ち。フリーアクション / attack / flee / cancel を受け付ける唯一のステップ。advance しない
import { defineStep } from "../_define.js";

export default defineStep({
  name: "select",
  scope: "battle",
  input: true,
  next: () => null,
  registrants: "— (attack → turn.command、flee → flee.command はコマンド側)",
});
