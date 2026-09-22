// startEntities: 章開始時にインベントリにある実体の設計図 [{kind, defId}]。base = characters.start*。寄与: relic.startWith*, star.start*
import { defineList } from "./_define.js";
import { master } from "../master/index.js";

export default defineList({
  name: "startEntities",
  base: (ctx) => {
    const c = master.get("characters", ctx.state.characterId);
    return [
      ...c.startEquipmentIds.map((id) => ({ kind: "equipment", defId: id })),
      ...c.startItemIds.map((id) => ({ kind: "item", defId: id })),
      ...c.startAbilityIds.map((id) => ({ kind: "ability", defId: id })),
    ];
  },
});
