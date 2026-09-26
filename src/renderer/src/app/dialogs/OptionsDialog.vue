<template>
  <DialogFrame :width="560" dialog-class="options_dialog" :z-index="650">
    <Ornament kind="head" :title="T('title.options')" />
    <div class="opt_rows">
      <div v-for="row in volumeRows" :key="row.key" class="opt_row">
        <span class="opt_label">{{ row.label }}</span>
        <input
          class="opt_slider"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="percent(row.key)"
          :style="{ '--p': `${percent(row.key)}%` }"
          @input="setVolume(row.key, $event.target.value)"
          @change="setVolume(row.key, $event.target.value, true)"
        />
        <span class="opt_value">{{ percent(row.key) }}</span>
      </div>
      <div class="opt_row toggle" @click="toggle('fastBattle')">
        <span class="opt_label">{{ T("options.fast") }}</span>
        <span class="opt_switch" :class="{ on: options.fastBattle }"><i></i></span>
      </div>
      <div class="opt_row toggle" @click="toggle('muteOnBlur')">
        <span class="opt_label">{{ T("options.muteOnBlur") }}</span>
        <span class="opt_switch" :class="{ on: options.muteOnBlur }"><i></i></span>
      </div>
      <div v-if="!edition.isAndroid && !edition.isWeb" class="opt_row toggle" @click="toggleFullscreen">
        <span class="opt_label">{{ T("options.fullscreen") }}</span>
        <span class="opt_switch" :class="{ on: session.fullscreen }"><i></i></span>
      </div>
      <div class="opt_row">
        <span class="opt_label">{{ T("options.language") }}</span>
        <span class="opt_value lang">{{ T("options.language.ja_jp") }}</span>
      </div>
    </div>
    <div class="edition_line hint">{{ edition.name }} / {{ edition.version }}</div>
    <Ornament kind="foot" />
    <div class="peek_buttons">
      <button class="btn" @click="close">{{ T("common.close") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// オプション (07 共通ダイアログ): 音量 3 本、戦闘高速化、非フォーカス時ミュート、フルスクリーン、言語 (v1 は日本語のみ表示)
import { computed } from "vue";
import { useSessionStore } from "../stores/session.js";
import { edition } from "@platform/edition.js";
import { setFullscreen } from "@platform/window.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const emit = defineEmits(["close"]);
const session = useSessionStore();
const options = computed(() => session.options);
const volumeRows = [
  { key: "masterVolume", label: T("volume.master") },
  { key: "bgmVolume", label: T("volume.bgm") },
  { key: "seVolume", label: T("volume.se") },
];
const percent = (k) => Math.round(options.value[k] * 100);
function setVolume(k, pct, commit = false) {
  session.setOptions({ [k]: Math.max(0, Math.min(100, Math.round(Number(pct)))) / 100 });
  if (commit && k !== "bgmVolume") SoundManager.playSe("select");
}
function toggle(k) {
  session.setOptions({ [k]: !options.value[k] });
  SoundManager.playSe(options.value[k] ? "ok" : "cancel");
}
function toggleFullscreen() {
  session.fullscreen = !session.fullscreen;
  setFullscreen(session.fullscreen);
  SoundManager.playSe("select");
}
function close() {
  SoundManager.playSe("close");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.options_dialog) {
  padding: 26px 34px 22px;
}
.opt_rows {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.opt_row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
  &.toggle {
    cursor: pointer;
    &:hover .opt_label {
      color: var(--color-main1);
    }
  }
  .opt_label {
    width: 170px;
    color: var(--color-white2);
    font-size: var(--font-size-small);
  }
  .opt_value {
    width: 40px;
    text-align: right;
    color: var(--color-white0);
    font-size: var(--font-size-small);
    &.lang {
      width: auto;
    }
  }
}
.opt_slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 18px;
  background: transparent;
  cursor: pointer;
  --p: 100%;
  &::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: var(--radius-round);
    background: linear-gradient(90deg, var(--color-main3) var(--p), var(--color-base3) var(--p));
    border: 1px solid var(--color-base2);
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -6px;
    border-radius: var(--radius-round);
    background: var(--color-white0);
    border: 2px solid var(--color-main4);
  }
}
.opt_switch {
  width: 42px;
  height: 22px;
  border-radius: var(--radius-round);
  background: var(--color-base3);
  border: 1px solid var(--color-base2);
  position: relative;
  transition: background 0.15s ease;
  i {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: var(--radius-round);
    background: var(--color-white3);
    transition:
      left 0.15s ease,
      background 0.15s ease;
  }
  &.on {
    background: var(--color-main4);
    i {
      left: 22px;
      background: var(--color-white0);
    }
  }
}
.edition_line {
  margin-top: 14px;
  text-align: right;
}
</style>
