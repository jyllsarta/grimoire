// 本のルール: 防具装備不可
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "bookRule",
  key: "armorForbidden",
  values: [],
  text: { icon: "armorForbidden" },
  permissions: {
    canActivateEquipment: {
      order: 300,
      check: (ctx, src, { entity }) => (ctx.master.get("equipments", entity.defId).category === "armor" ? "armorForbidden" : null),
    },
  },
});
