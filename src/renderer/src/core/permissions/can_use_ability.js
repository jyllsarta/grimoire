// canUseAbility({entity}): アビリティを使えるか。base = ready。寄与: status.arousal, status.sleep
import { definePermission } from "./_define.js";

export default definePermission({
  name: "canUseAbility",
  base: (ctx, { entity }) => {
    if (!entity || entity.kind !== "ability") return "notAbility";
    if (!entity.ready) return "abilityNotReady";
    return null;
  },
});
