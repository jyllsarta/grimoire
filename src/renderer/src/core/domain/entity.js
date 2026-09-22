// 実体 (equipment / item / ability) とパネルの kind ↔ マスタテーブルの対応
import { master } from "../master/index.js";

export const ENTITY_KINDS = ["equipment", "item", "ability"];

export function tableOfKind(kind) {
  switch (kind) {
    case "equipment":
      return "equipments";
    case "item":
      return "items";
    case "ability":
      return "abilities";
    case "enemy":
      return "enemies";
    case "event":
      return "events";
    case "relic":
      return "relics";
    default:
      throw new Error(`unknown kind: ${kind}`);
  }
}

export function defOf(kindOrEntity, defId) {
  if (typeof kindOrEntity === "object") return master.get(tableOfKind(kindOrEntity.kind), kindOrEntity.defId);
  return master.get(tableOfKind(kindOrEntity), defId);
}

// entity の占有幅 (マスタ size)
export function entitySize(entity) {
  return defOf(entity).size;
}

// 実体の新品を作る (uid は呼び出し側が発行する)
export function createEntity(uid, kind, defId) {
  const def = master.get(tableOfKind(kind), defId);
  const durability = def.durability == null ? -1 : def.durability;
  const entity = { uid, kind, defId, pos: -1, durability, memo: {} };
  if (kind === "equipment") entity.active = false;
  if (kind === "ability") {
    entity.ready = true;
    entity.progress = 0;
  }
  return entity;
}
