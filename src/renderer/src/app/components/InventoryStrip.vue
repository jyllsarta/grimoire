<template>
  <div class="inv_strip" :style="{ width: `${stripWidth}px`, height: `${cellH}px` }">
    <div
      v-for="i in totalCells"
      :key="i"
      class="inv_cell"
      :class="{ filled: filledCells.has(i - 1), locked: i - 1 >= slotCount, place_ok: placeOkCells.has(i - 1) }"
      :style="{ width: `${cellW}px` }"
      @click="$emit('cellClick', i - 1)"
    ></div>
    <EntityTile
      v-for="e in placed"
      :key="e.uid"
      :entity="e"
      :left="drag && drag.uid === e.uid ? drag.left : leftOf(e)"
      :width="widthOf(e)"
      :height="cellH"
      :concealed="concealed"
      :selected="selectedUid === e.uid"
      :dragging="drag?.uid === e.uid && drag.moved"
      @pointerdown="onPointerDown($event, e)"
      @pointermove="onPointerMove($event, e)"
      @pointerup="onPointerUp($event, e)"
      @pointercancel="onPointerCancel"
    />
  </div>
</template>

<script setup>
// インベントリの帯 (tale renderInventryStrip / attachDragReorder)。マス幅は正方形を上限に均等割り。
// ドラッグで並べ替え (draggable のとき): 6px 以上動いたらドラッグ、動かなければ click。上へ 60px 放ると shelf (allowShelf)
import { computed, ref } from "vue";
import { entitySize } from "@core/domain/entity.js";
import { stageZoom } from "../ui/directives.js";
import EntityTile from "./EntityTile.vue";

const props = defineProps({
  entities: { type: Array, required: true },
  slotCount: { type: Number, required: true },
  totalCells: { type: Number, default: null }, // 未拡張のマスも描くとき (整理ダイアログ) は maxSlots
  stripW: { type: Number, default: 694 },
  cellH: { type: Number, default: 96 },
  gap: { type: Number, default: 5 },
  concealed: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  allowShelf: { type: Boolean, default: false },
  selectedUid: { type: Number, default: null },
  placeOk: { type: Function, default: null }, // (pos) => bool (整理ダイアログの候補マス)
});
const emit = defineEmits(["entClick", "drop", "cellClick"]);

const totalCells = computed(() => props.totalCells ?? props.slotCount);
const cellW = computed(() => Math.floor(Math.min(props.cellH, (props.stripW - props.gap * (totalCells.value - 1)) / totalCells.value)));
const stripWidth = computed(() => totalCells.value * cellW.value + (totalCells.value - 1) * props.gap);
const placed = computed(() => props.entities.filter((e) => e.pos != null && e.pos >= 0));
const filledCells = computed(() => {
  const set = new Set();
  for (const e of placed.value) for (let k = 0; k < entitySize(e); k++) set.add(e.pos + k);
  return set;
});
const placeOkCells = computed(() => {
  const set = new Set();
  if (!props.placeOk) return set;
  for (let i = 0; i < props.slotCount; i++) if (props.placeOk(i)) set.add(i);
  return set;
});
const leftOf = (e) => e.pos * (cellW.value + props.gap);
const widthOf = (e) => entitySize(e) * cellW.value + (entitySize(e) - 1) * props.gap;

// ---- ドラッグ ----
const drag = ref(null);
function onPointerDown(ev, e) {
  if (ev.button !== 0) return;
  drag.value = { uid: e.uid, startX: ev.clientX, startY: ev.clientY, startLeft: leftOf(e), left: leftOf(e), moved: false, pointerId: ev.pointerId };
  if (props.draggable) {
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch {
      /* ok */
    }
  }
}
function onPointerMove(ev, e) {
  const d = drag.value;
  if (!d || d.uid !== e.uid || !props.draggable) return;
  const z = stageZoom();
  const dx = (ev.clientX - d.startX) / z;
  const dy = (ev.clientY - d.startY) / z;
  if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
  if (d.moved) d.left = d.startLeft + dx;
  d.dy = dy;
}
function onPointerUp(ev, e) {
  const d = drag.value;
  if (!d || d.uid !== e.uid) return;
  drag.value = null;
  if (!d.moved) {
    emit("entClick", e);
    return;
  }
  if (props.allowShelf && d.dy < -60) {
    emit("drop", e, null);
    return;
  }
  const pos = Math.round(d.left / (cellW.value + props.gap));
  emit("drop", e, pos);
}
function onPointerCancel() {
  drag.value = null;
}
</script>

<style lang="scss" scoped>
.inv_strip {
  position: relative;
  display: flex;
  gap: 5px;
  flex: none;
  margin-left: auto;
  margin-right: auto;
}
.inv_cell {
  height: 100%;
  border-radius: var(--radius-card);
  background: var(--color-base4);
  border: 1px dashed var(--color-base2);
  position: relative;
  flex: none;
  &.filled {
    background: none;
    opacity: 0.15;
  }
  &.locked {
    background: repeating-linear-gradient(45deg, var(--color-base5), var(--color-base5) 6px, var(--color-base4) 6px, var(--color-base4) 12px);
    border-style: solid;
    opacity: 0.55;
  }
  &.place_ok {
    background: rgba(92, 221, 120, 0.25) !important;
    opacity: 1;
    cursor: pointer;
  }
}
</style>
