<template>
  <DialogFrame :width="1000" dialog-class="organize_dialog" :tone="pendingMode ? 'bad' : ''">
    <Ornament kind="head" :title="pendingMode ? T('pending.heading') : T('inventory.organize')" :variant="pendingMode ? 'bad' : ''" />
    <div v-if="pendingMode" class="pending_note">{{ T("pending.note", { name: pendingName }) }}</div>
    <div class="organize_hint hint">{{ selected ? T("organize.hintPlace") : T("organize.hintDrag") }}</div>

    <div class="strip_wrap">
      <InventoryStrip
        :entities="placed"
        :slot-count="slotCount"
        :total-cells="maxSlots"
        :strip-w="930"
        :cell-h="100"
        draggable
        allow-shelf
        :selected-uid="selected?.uid ?? null"
        :place-ok="selected ? placeOk : null"
        @ent-click="onEntClick"
        @drop="onDrop"
        @cell-click="onCellClick"
      />
      <div class="slot_note hint">{{ T("organize.slots", { n: slotCount, max: maxSlots }) }}</div>
    </div>

    <div class="stage_shelf" :class="{ has: shelf.length }">
      <div v-if="!shelf.length" class="shelf_empty hint">{{ T("organize.shelfEmpty") }}</div>
      <div
        v-for="e in shelf"
        :key="e.uid"
        class="shelf_ent"
        :class="{ selected: selected?.uid === e.uid, pending_ent: pendingUids.has(e.uid) }"
        :data-desc="`${e.kind}:${e.defId}`"
        @click="select(e)"
      >
        <img class="icon_img" :src="entIcon(e)" alt="" />
        <div class="shelf_name">{{ defOf(e).name }}</div>
        <div class="shelf_size hint">{{ T("stat.size", { n: entitySize(e) }) }}</div>
      </div>
    </div>

    <div v-if="message" class="hint warn">{{ message }}</div>
    <Ornament kind="foot" />
    <div class="peek_buttons">
      <button class="btn" :disabled="!canConfirm" @click="confirm">{{ T("common.ok") }}</button>
      <button v-if="pendingMode" class="btn danger" @click="discard">{{ T("pending.discard") }}</button>
      <button v-else class="btn sub" @click="cancel">{{ T("common.cancel") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// 整理ダイアログ (tale organize): 帯の上でドラッグして並べ替え、上へ放ると棚に上がる。棚の物をクリック → 帯の空きマスをクリックで置く。
// mode "plain" = arrangeInventory、"pending" = 保留 (インベントリあふれ) の解決 (resolvePending)。
// 決定できるのは元からある実体が全部帯に乗っているとき (捨てるのは pending の「受け取らない」だけ)
import { computed, ref } from "vue";
import { defOf, entitySize } from "@core/domain/entity.js";
import { master } from "@core/master/index.js";
import { q } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { entIcon } from "../ui/entity_view.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";
import InventoryStrip from "../components/InventoryStrip.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const run = useRunStore();
const pendingMode = computed(() => props.dialog.params.mode === "pending");
const pending = computed(() => (pendingMode.value ? run.state.progress.pending[0] : null));
const pendingUids = computed(() => new Set(pending.value ? [pending.value.entity.uid] : []));
const pendingName = computed(() => (pending.value ? defOf(pending.value.entity).name : ""));
const slotCount = computed(() => q(run.state).derive("slotCount"));
const maxSlots = master.config.maxSlots;

// ローカルの配置 (決定まで state は触らない)
const items = ref([...run.state.inventory.entities.map((e) => ({ ...e })), ...(pending.value ? [{ ...pending.value.entity, pos: null }] : [])]);
const placed = computed(() => items.value.filter((e) => e.pos != null && e.pos >= 0));
const shelf = computed(() => items.value.filter((e) => e.pos == null || e.pos < 0));
const selected = ref(null);
const message = ref("");

function occupancy(exceptUid = null) {
  const cells = new Array(slotCount.value).fill(null);
  for (const e of placed.value) {
    if (e.uid === exceptUid) continue;
    for (let i = e.pos; i < e.pos + entitySize(e); i++) if (i < cells.length) cells[i] = e.uid;
  }
  return cells;
}
function freeAt(pos, size, exceptUid = null) {
  if (pos < 0 || pos + size > slotCount.value) return false;
  const cells = occupancy(exceptUid);
  for (let i = pos; i < pos + size; i++) if (cells[i] != null) return false;
  return true;
}
const placeOk = (pos) => !!selected.value && freeAt(pos, entitySize(selected.value), selected.value.uid);
const canConfirm = computed(() => items.value.every((e) => e.pos != null && e.pos >= 0));

function select(e) {
  SoundManager.playSe("select");
  selected.value = selected.value?.uid === e.uid ? null : e;
}
function onEntClick(e) {
  select(items.value.find((x) => x.uid === e.uid));
}
function onCellClick(pos) {
  if (!selected.value) return;
  const e = items.value.find((x) => x.uid === selected.value.uid);
  if (!freeAt(pos, entitySize(e), e.uid)) {
    SoundManager.playSe("ng");
    return;
  }
  e.pos = pos;
  selected.value = null;
  SoundManager.playSe("equip");
}
function onDrop(e, pos) {
  const it = items.value.find((x) => x.uid === e.uid);
  if (pos == null) {
    it.pos = null;
    SoundManager.playSe("unequip");
    return;
  }
  if (freeAt(pos, entitySize(it), it.uid)) {
    it.pos = pos;
    SoundManager.playSe("equip");
  } else SoundManager.playSe("ng");
}
function confirm() {
  const arrangement = items.value.map((e) => ({ uid: e.uid, pos: e.pos }));
  const r = pendingMode.value ? run.dispatch("resolvePending", { index: 0, arrangement }) : run.dispatch("arrangeInventory", { arrangement });
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
    return;
  }
  SoundManager.playSe("ok");
  emit("close", { ok: true });
}
function discard() {
  const r = run.dispatch("resolvePending", { index: 0, discard: true });
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
    return;
  }
  SoundManager.playSe("cancel");
  emit("close", { discarded: true });
}
function cancel() {
  SoundManager.playSe("cancel");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.organize_dialog) {
  padding: 24px 30px;
}
.pending_note {
  margin-top: 12px;
  color: var(--color-negative1);
}
.organize_hint {
  margin-top: 8px;
  white-space: normal;
}
.strip_wrap {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.stage_shelf {
  margin-top: 14px;
  min-height: 108px;
  border-radius: var(--radius-panel);
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed var(--color-base1);
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: stretch;
  flex-wrap: wrap;
  .shelf_empty {
    margin: auto;
  }
  .shelf_ent {
    width: 120px;
    padding: 8px 6px;
    border-radius: var(--radius-card);
    background: var(--color-base4);
    border: 1px solid var(--color-base1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition:
      filter 0.1s ease,
      transform 0.1s ease;
    img {
      width: 40px;
      height: 40px;
    }
    .shelf_name {
      font-size: var(--font-size-mini);
      color: var(--color-white0);
      text-align: center;
    }
    &:hover {
      filter: brightness(1.12);
    }
    &.selected {
      border-color: var(--color-accent2);
      box-shadow: 0 0 0 2px var(--color-accent2);
      transform: translateY(-3px);
    }
    &.pending_ent {
      border-color: var(--color-negative2);
    }
  }
}
.warn {
  margin-top: 8px;
  color: var(--color-negative1);
}
</style>
