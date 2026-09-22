// インベントリ (02 inventory)。横 1 列、pos は左端マス、占有幅はマスタ size
import { master } from "../master/index.js";
import { entitySize, createEntity } from "./entity.js";

// マスの占有表 (uid か null)
export function occupancy(state, slotCount, { exclude = [] } = {}) {
  const cells = new Array(slotCount).fill(null);
  for (const e of state.inventory.entities) {
    if (exclude.includes(e.uid)) continue;
    const size = entitySize(e);
    for (let i = e.pos; i < e.pos + size && i < slotCount; i++) if (i >= 0) cells[i] = e.uid;
  }
  return cells;
}

// size マスが連続で空いている最左の pos。無ければ -1
export function findFreePos(state, size, slotCount, opts) {
  const cells = occupancy(state, slotCount, opts);
  for (let pos = 0; pos + size <= slotCount; pos++) {
    let free = true;
    for (let i = pos; i < pos + size; i++) if (cells[i] != null) free = false;
    if (free) return pos;
  }
  return -1;
}

export function findEntity(state, uid) {
  return state.inventory.entities.find((e) => e.uid === uid) ?? null;
}

export function removeEntity(state, uid) {
  const i = state.inventory.entities.findIndex((e) => e.uid === uid);
  if (i < 0) return null;
  return state.inventory.entities.splice(i, 1)[0];
}

// ON の武器 / 防具
export function activeWeapons(state) {
  return state.inventory.entities.filter((e) => e.kind === "equipment" && e.active && master.get("equipments", e.defId).category === "weapon");
}

export function activeArmors(state) {
  return state.inventory.entities.filter((e) => e.kind === "equipment" && e.active && master.get("equipments", e.defId).category === "armor");
}

// 左右に接する実体 (右が空か、も)。隣接効果のパッシブが読む query (03 adjacent)
export function adjacent(state, entity) {
  const size = entitySize(entity);
  const left = state.inventory.entities.find((e) => e.uid !== entity.uid && e.pos + entitySize(e) === entity.pos) ?? null;
  const right = state.inventory.entities.find((e) => e.uid !== entity.uid && e.pos === entity.pos + size) ?? null;
  return { left, right, rightEmpty: right == null };
}

// 章開始状態のインベントリ (派生リスト startEntities を実体化)。run.start と chapter.clear の reset が使う
export function resetInventoryToStart(ctx) {
  const state = ctx.state;
  state.inventory.entities = [];
  state.inventory.concealed = false;
  const slotCount = ctx.derive("slotCount");
  for (const spec of ctx.list("startEntities")) {
    const entity = createEntity(ctx.uid(), spec.kind, spec.defId);
    const pos = findFreePos(state, entitySize(entity), slotCount);
    if (pos < 0) throw new Error(`開始インベントリが入り切らない: ${spec.kind} ${spec.defId} (slotCount=${slotCount})`);
    entity.pos = pos;
    state.inventory.entities.push(entity);
    ctx.fire("entity.gained", { entity, source: { family: "standard", key: "start" } });
  }
}

// arrangement = [{uid, pos}] を検証する。extra は arrangement に含めてよい inventory 外の実体 (保留中の獲得物)。
// 戻り値: null (OK) か 理由キー
export function validateArrangement(state, arrangement, slotCount, extra = []) {
  const pool = [...state.inventory.entities, ...extra];
  const cells = new Array(slotCount).fill(null);
  const seen = new Set();
  for (const a of arrangement) {
    const e = pool.find((x) => x.uid === a.uid);
    if (!e) return "unknownEntity";
    if (seen.has(a.uid)) return "duplicateEntity";
    seen.add(a.uid);
    const size = entitySize(e);
    if (!(Number.isInteger(a.pos) && a.pos >= 0 && a.pos + size <= slotCount)) return "outOfSlots";
    for (let i = a.pos; i < a.pos + size; i++) {
      if (cells[i] != null) return "overlap";
      cells[i] = a.uid;
    }
  }
  // inventory の全実体が arrangement に載っていること (捨てるのは別コマンド)
  for (const e of state.inventory.entities) if (!seen.has(e.uid)) return "missingEntity";
  return null;
}

export function applyArrangement(state, arrangement) {
  for (const a of arrangement) {
    const e = findEntity(state, a.uid);
    if (e) e.pos = a.pos;
  }
}
