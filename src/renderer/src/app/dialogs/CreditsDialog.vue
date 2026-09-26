<template>
  <DialogFrame :width="620" dialog-class="credits_dialog" :z-index="650" close-on-backdrop @backdrop="close">
    <Ornament kind="head" :title="T('credits.heading')" />
    <div class="credit_sections no_scrollbar">
      <div v-for="s in sections" :key="s.section" class="credit_section">
        <div class="section_name">{{ T(`credits.section.${s.section}`) }}</div>
        <div v-for="c in s.rows" :key="c.id" class="credit_row">
          <span class="credit_name">{{ c.name }}</span>
          <span v-if="c.url" class="credit_url hint">{{ c.url }}</span>
        </div>
      </div>
    </div>
    <div class="peek_buttons">
      <button class="btn sub" @click="close">{{ T("common.close") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// クレジット (マスタ credits を section ごとに)
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const emit = defineEmits(["close"]);
const sections = computed(() => {
  const map = new Map();
  for (const c of [...master.all("credits")].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    if (!map.has(c.section)) map.set(c.section, { section: c.section, rows: [] });
    map.get(c.section).rows.push(c);
  }
  return [...map.values()];
});
function close() {
  SoundManager.playSe("close");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.credits_dialog) {
  padding: 26px 34px 20px;
}
.credit_sections {
  margin-top: 16px;
  max-height: 440px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .section_name {
    color: var(--color-main1);
    font-size: var(--font-size-small);
    letter-spacing: 0.1em;
    border-bottom: 1px solid var(--color-base2);
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .credit_row {
    display: flex;
    gap: 12px;
    align-items: baseline;
    padding: 2px 0;
  }
}
</style>
