// chapterPanelSpecs({chapterId}): 章の山札の設計図 [{kind, defId}] (placeholder の解決込み)。
// base = 章の各 Ids + characters.initial* + ownedPanels。寄与: star.initial*, star.chapterEnemy, bookRule
import { defineList } from "./_define.js";
import { master } from "../master/index.js";
import { resolveEnemyPlaceholder, resolveEventPlaceholder } from "../domain/placeholder.js";

export default defineList({
  name: "chapterPanelSpecs",
  base: (ctx, { chapterId }) => {
    const state = ctx.state;
    const chapter = master.get("chapters", chapterId);
    const c = master.get("characters", state.characterId);
    const specs = [];
    for (const id of chapter.enemyIds) specs.push({ kind: "enemy", defId: resolveEnemyPlaceholder(state, id) });
    for (const id of chapter.equipmentIds) specs.push({ kind: "equipment", defId: id });
    for (const id of chapter.itemIds) specs.push({ kind: "item", defId: id });
    for (const id of chapter.abilityIds) specs.push({ kind: "ability", defId: id });
    for (const id of chapter.eventIds) specs.push({ kind: "event", defId: resolveEventPlaceholder(state, id) });
    for (const id of c.initialEquipmentIds) specs.push({ kind: "equipment", defId: id });
    for (const id of c.initialItemIds) specs.push({ kind: "item", defId: id });
    for (const id of c.initialAbilityIds) specs.push({ kind: "ability", defId: id });
    for (const p of state.ownedPanels) specs.push({ kind: p.kind, defId: p.defId });
    return specs;
  },
});
