// canActivateEquipment({entity}): 装備を ON にできるか。寄与: status.paralyze (武器), passive.mustWithOtherWeapon, passive.onlyWithoutAbilityThisTurn, bookRule.armorForbidden, status.sleep
import { definePermission } from "./_define.js";

export default definePermission({
  name: "canActivateEquipment",
  base: (ctx, { entity }) => (!entity || entity.kind !== "equipment" ? "notEquipment" : null),
});
