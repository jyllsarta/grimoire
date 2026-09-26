<template>
  <DialogFrame :width="520" dialog-class="confirm_dialog" :z-index="700">
    <div v-if="dialog.params.title" class="confirm_title">{{ dialog.params.title }}</div>
    <div class="confirm_text">{{ dialog.params.text }}</div>
    <div class="peek_buttons">
      <button class="btn" :class="{ danger: dialog.params.danger }" @click="answer(true)">{{ dialog.params.yes || T("common.yes") }}</button>
      <button class="btn sub" @click="answer(false)">{{ dialog.params.no || T("common.no") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// 確認 (はい / いいえ)。openDialog("confirm", { text, title?, yes?, no?, danger? }) の Promise が true / false で解決する
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";

defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
function answer(yes) {
  SoundManager.playSe(yes ? "ok" : "cancel");
  emit("close", yes);
}
</script>

<style lang="scss" scoped>
:deep(.confirm_dialog) {
  padding: 34px 40px;
  text-align: center;
}
.confirm_title {
  color: var(--color-main1);
  font-size: var(--font-size-medium);
  margin-bottom: 12px;
}
.confirm_text {
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
