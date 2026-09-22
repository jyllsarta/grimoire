// action.ability: アビリティ使用 (フリーアクション) の解決後 (payload: { entity, def })
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "action.ability",
  scope: "run",
  registrants: "recharge.otherAbilityUse (動詞 recharge 側)、passive.onlyWithoutAbilityThisTurn (自動 OFF)",
  standard: [
    std("count", 500, (ctx) => {
      const b = ctx.state.battle;
      if (b) b.turnMemo.abilitiesUsed = (b.turnMemo.abilitiesUsed || 0) + 1;
    }),
  ],
});
