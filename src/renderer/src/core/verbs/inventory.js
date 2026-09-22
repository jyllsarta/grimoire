// 動詞: gain / spend / recharge (インベントリの実体を増減する横断規則)
import { master } from "../master/index.js";
import { createEntity, entitySize } from "../domain/entity.js";
import { findFreePos, removeEntity } from "../domain/inventory.js";
import { describeSource } from "./_source.js";

// 空きがあれば配置して entity.gained。無ければ progress.pending に積む
export function gain(ctx, kind, defId, { source = null } = {}) {
  const state = ctx.state;
  const entity = createEntity(ctx.uid(), kind, defId);
  const pos = findFreePos(state, entitySize(entity), ctx.derive("slotCount"));
  if (pos >= 0) {
    entity.pos = pos;
    state.inventory.entities.push(entity);
    ctx.emit("gain", { uid: entity.uid, kind, defId, pos });
    ctx.fire("entity.gained", { entity, source });
  } else {
    state.progress.pending.push({ kind: "gain", entity, source: describeSource(source) });
    ctx.emit("pendingGain", { uid: entity.uid, kind, defId });
  }
  return entity;
}

// 耐久 -1、0 で消して entity.spent (と recharge(exhaust))。消えたら true
export function spend(ctx, entity) {
  if (entity.durability < 0) return false;
  entity.durability -= 1;
  if (entity.durability > 0) return false;
  removeEntity(ctx.state, entity.uid);
  ctx.emit({ equipment: "equipBreak", item: "itemBreak", ability: "abilityBreak" }[entity.kind], {
    uid: entity.uid,
    kind: entity.kind,
    defId: entity.defId,
  });
  ctx.fire("entity.spent", { entity, kind: entity.kind });
  ctx.recharge("exhaust", 1);
  return true;
}

// 休んでいるアビリティの progress を進め、達成で ready
export function recharge(ctx, type, amount, { excludeDefId = null } = {}) {
  for (const ent of ctx.state.inventory.entities) {
    if (ent.kind !== "ability" || ent.ready) continue;
    if (excludeDefId != null && ent.defId === excludeDefId) continue;
    const def = master.get("abilities", ent.defId);
    if (def.rechargeType !== type) continue;
    ent.progress += amount;
    if (ent.progress >= (def.rechargeValue ?? 1)) {
      ent.ready = true;
      ent.progress = 0;
      ctx.emit("abilityReady", { uid: ent.uid, defId: ent.defId });
    }
  }
}
