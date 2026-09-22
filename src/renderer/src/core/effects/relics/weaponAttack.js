// レリック: ON 中の武器 1 本ごとに攻撃力 +values[0] (素手には乗らない)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",
  key: "weaponAttack",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "attack" },
  modifiers: {
    attackPower: {
      stage: "flat",
      order: 320,
      apply: (ctx, src) => {
        const weapons = ctx.state.inventory.entities.filter(
          (e) => e.kind === "equipment" && e.active && ctx.master.get("equipments", e.defId).category === "weapon",
        );
        if (weapons.length === 0) return null;
        return { label: "relic.weaponAttack", value: src.values[0] * weapons.length };
      },
    },
  },
});
