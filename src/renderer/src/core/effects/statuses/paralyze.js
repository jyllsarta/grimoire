// 麻痺 (04): onApply で武器を全部 OFF。permission canActivateEquipment (武器) 不許可
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "paralyze",
  values: [],
  text: { shape: "paralyze", chip: "paralyze" },
  onApply: (ctx, src, { target }) => {
    if (target !== "player") return;
    let any = false;
    for (const e of ctx.state.inventory.entities) {
      if (e.kind === "equipment" && e.active && ctx.master.get("equipments", e.defId).category === "weapon") {
        e.active = false;
        any = true;
      }
    }
    if (any) ctx.emit("weaponsForcedOff", {});
  },
  permissions: {
    canActivateEquipment: {
      order: 200,
      check: (ctx, src, { entity }) =>
        src.side === "player" && ctx.master.get("equipments", entity.defId).category === "weapon" ? "paralyze" : null,
    },
  },
});
