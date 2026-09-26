<template>
  <DialogFrame :width="620" dialog-class="tips_dialog" :z-index="610" light close-on-backdrop @backdrop="close">
    <Ornament kind="head" :title="tip.title" />
    <div class="tips_body">{{ tip.body }}</div>
    <div class="click_hint hint">{{ T("detail.clickToClose") }}</div>
  </DialogFrame>
</template>

<script setup>
// tips (右クリックの 2 段目 / 用語の説明)。マスタ tips.key
import { computed, onMounted } from "vue";
import { master } from "@core/master/index.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const tip = computed(() => {
  const row = master.all("tips").find((t) => t.key === props.dialog.params.key);
  if (!row) {
    console.warn(`tips に key="${props.dialog.params.key}" が無い`);
    return { title: props.dialog.params.key, body: "" };
  }
  return row;
});
onMounted(() => SoundManager.playSe("tips"));
function close() {
  SoundManager.playSe("cancel");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.tips_dialog) {
  padding: 26px 34px 18px;
}
.tips_body {
  margin-top: 18px;
  line-height: 1.8;
  white-space: pre-wrap;
  color: var(--color-white0);
}
.click_hint {
  margin-top: 16px;
  text-align: center;
}
</style>
