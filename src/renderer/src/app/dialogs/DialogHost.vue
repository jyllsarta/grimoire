<template>
  <template v-for="d in session.dialogs" :key="d.id">
    <component :is="componentFor(d.name)" :dialog="d" @close="(result) => session.closeDialog(d.id, result)" />
  </template>
</template>

<script setup>
// ダイアログの置き場 (01「dialogs/」)。session.dialogs のスタックを後ろほど手前に描く。
// 各ダイアログは props.dialog (id / name / params) を受け取り、emit("close", result) で閉じる
import { useSessionStore } from "../stores/session.js";
import PanelPeekDialog from "./PanelPeekDialog.vue";
import EventDialog from "./EventDialog.vue";
import EventResultDialog from "./EventResultDialog.vue";
import OrganizeDialog from "./OrganizeDialog.vue";
import DetailDialog from "./DetailDialog.vue";
import TipsDialog from "./TipsDialog.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import DeckDialog from "./DeckDialog.vue";
import SkitDialog from "./SkitDialog.vue";
import OptionsDialog from "./OptionsDialog.vue";
import SavedataDialog from "./SavedataDialog.vue";
import CreditsDialog from "./CreditsDialog.vue";
import DifficultyDialog from "./DifficultyDialog.vue";

const session = useSessionStore();
const registry = {
  panelPeek: PanelPeekDialog,
  event: EventDialog,
  eventResult: EventResultDialog,
  organize: OrganizeDialog,
  detail: DetailDialog,
  tips: TipsDialog,
  confirm: ConfirmDialog,
  deck: DeckDialog,
  skit: SkitDialog,
  options: OptionsDialog,
  savedata: SavedataDialog,
  credits: CreditsDialog,
  difficulty: DifficultyDialog,
};

function componentFor(name) {
  const c = registry[name];
  if (!c) console.warn(`[dialogs] unknown dialog: ${name}`);
  return c || ConfirmDialog;
}
</script>
