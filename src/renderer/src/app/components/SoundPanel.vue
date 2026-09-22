<template>
  <div class="sound_panel">
    <button v-if="!open" class="btn sub small" @click="open = true">{{ T("volume.title") }}</button>
    <div v-else class="menu panel_glass">
      <div class="row heading_row">
        <span>{{ T("volume.title") }}</span>
        <button class="btn sub small" @click="open = false">{{ T("common.close") }}</button>
      </div>
      <label class="row">
        <span class="label">{{ T("volume.master") }}</span>
        <input type="range" min="0" max="1" step="0.05" :value="options.masterVolume" @input="set('masterVolume', $event.target.value)" />
      </label>
      <label class="row">
        <span class="label">{{ T("volume.bgm") }}</span>
        <input type="range" min="0" max="1" step="0.05" :value="options.bgmVolume" @input="set('bgmVolume', $event.target.value)" />
      </label>
      <label class="row">
        <span class="label">{{ T("volume.se") }}</span>
        <input type="range" min="0" max="1" step="0.05" :value="options.seVolume" @input="set('seVolume', $event.target.value)" />
      </label>
      <label class="row">
        <span class="label">{{ T("options.fast") }}</span>
        <input type="checkbox" :checked="options.fastBattle" @change="session.setOptions({ fastBattle: $event.target.checked })" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { T } from "../text.js";

const session = useSessionStore();
const open = ref(false);
const options = computed(() => session.options);

function set(key, value) {
  session.setOptions({ [key]: Number(value) });
}
</script>

<style lang="scss" scoped>
.sound_panel {
  .menu {
    width: 240px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-small);
  }
  .heading_row {
    justify-content: space-between;
    color: var(--color-main1);
  }
  .label {
    width: 72px;
    flex: none;
  }
  input[type="range"] {
    flex: 1;
    min-width: 0;
  }
}
</style>
