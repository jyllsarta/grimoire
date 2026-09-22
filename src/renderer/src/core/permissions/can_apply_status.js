// canApplyStatus({target, key}): 付与ガード (04 付与規則 1)。side の不一致、他ヒロインの固有バステ → skip
import { definePermission } from "./_define.js";
import { master } from "../master/index.js";

export default definePermission({
  name: "canApplyStatus",
  base: (ctx, { target, key }) => {
    const def = master.findByKey("statuses", key);
    if (!def) return "unknownStatus";
    const side = target === "player" ? "player" : "enemy";
    if (def.side !== "both" && def.side !== side) return "sideMismatch";
    if (def.kind === "unique" && def.characterId !== ctx.state.characterId) return "otherHeroineUnique";
    return null;
  },
});
