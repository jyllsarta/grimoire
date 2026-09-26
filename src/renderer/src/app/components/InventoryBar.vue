<template>
  <div class="inventory_bar panel_glass" :class="{ in_battle: inBattle }" data-tips="inventory">
    <div class="inv_head">
      <div class="heading">{{ T("inventory.heading") }}</div>
      <span class="hint flex_hint">{{ message }}</span>
      <button v-if="!inBattle && !run.state.inventory.concealed" class="btn sub small" @click="organize">{{ T("inventory.organize") }}</button>
    </div>
    <InventoryStrip
      :entities="run.state.inventory.entities"
      :slot-count="slotCount"
      :concealed="run.state.inventory.concealed"
      :draggable="!inBattle && !run.state.inventory.concealed"
      @ent-click="onEntClick"
      @drop="onDrop"
    />
  </div>
</template>

<script setup>
// 画面下のインベントリ帯 (02「画面と state の対応」)。クリックで 装備 ON/OFF / アイテム使用 / アビリティ使用 (dispatch)。
// 非戦闘時はドラッグで並べ替え (arrangeInventory)。戦闘中はそのまま戦闘用になる
import { computed, ref } from "vue";
import { useRunStore } from "../stores/run.js";
import { useSessionStore } from "../stores/session.js";
import { q } from "@core/queries/index.js";
import { entitySize } from "@core/domain/entity.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import InventoryStrip from "./InventoryStrip.vue";

const run = useRunStore();
const session = useSessionStore();
const inBattle = computed(() => !!run.state.battle);
const slotCount = computed(() => q(run.state).derive("slotCount"));
const message = ref("");
let messageTimer = null;

function flash(text) {
  message.value = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (message.value = ""), 2000);
}

function onEntClick(e) {
  if (run.state.battle && run.state.battle.step !== "select") return;
  const name = { equipment: "toggleEquip", item: "useItem", ability: "useAbility" }[e.kind];
  const r = run.dispatch(name, { uid: e.uid });
  if (!r.ok) {
    SoundManager.playSe("ng");
    flash(reasonText(r.reason));
  } else if (name === "toggleEquip") SoundManager.playSe(r.active ? "equip" : "unequip");
}

function onDrop(e, pos) {
  if (pos == null) return;
  const arrangement = run.state.inventory.entities.map((x) => ({ uid: x.uid, pos: x.uid === e.uid ? pos : x.pos }));
  const r = run.dispatch("arrangeInventory", { arrangement });
  SoundManager.playSe(r.ok ? "equip" : "ng");
  void entitySize;
}

function organize() {
  SoundManager.playSe("open");
  session.openDialog("organize", { mode: "plain" });
}
</script>

<style lang="scss" scoped>
.inventory_bar {
  padding: 10px 18px 12px;
  display: flex;
  flex-direction: column;
  border-bottom: none;
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  .inv_head {
    display: flex;
    align-items: center;
    gap: 12px;
    .heading {
      font-size: var(--font-size-small);
    }
    .flex_hint {
      flex: 1;
      color: var(--color-negative1);
    }
  }
  :deep(.inv_strip) {
    margin-top: 8px;
  }
}
</style>
