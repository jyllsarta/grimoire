// player.strike.after: 一撃の直後。drain (300) / poisonApply (400) はパッシブ側、武器摩耗 (500) は標準
import { defineStep, std } from "../_define.js";
import { activeWeapons } from "../../domain/inventory.js";

export default defineStep({
  name: "player.strike.after",
  scope: "battle",
  next: () => "player.act.end",
  registrants: "passive.drain (300)、passive.poison (400)",
  standard: [
    std("weaponWear", 500, (ctx) => {
      for (const w of activeWeapons(ctx.state)) {
        ctx.emit("weaponWear", { uid: w.uid });
        ctx.spend(w);
      }
    }),
  ],
});
