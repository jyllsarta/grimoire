// player.strike: 派生 attackPower と 派生 strikeFlags で合算 1 発。pierce は敵のブロックとシールドの両方を無視。登録不可 (内訳は派生値で)
import { defineStep, std } from "../_define.js";

export default defineStep({
  name: "player.strike",
  scope: "battle",
  next: () => "player.strike.after",
  registrants: "(登録不可。内訳は派生 attackPower / strikeFlags で)",
  standard: [
    std("strike", 500, (ctx) => {
      const power = ctx.derive("attackPower");
      const flags = ctx.derive("strikeFlags");
      const pierce = flags.includes("pierce");
      const r = ctx.damageEnemy(power, { ignoreBlock: pierce, pierceShield: pierce, tag: "strike", source: { family: "standard", key: "strike" } });
      ctx.state.battle.turnMemo.lastStrikeDmg = r.dmg;
      ctx.emit("playerStrike", { power, flags, dmg: r.dmg, blocked: r.blocked, absorbed: r.absorbed });
    }),
  ],
});
