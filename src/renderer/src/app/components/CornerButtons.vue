<template>
  <div class="corner">
    <button class="volume_btn" :class="{ muted }" :title="T('volume.title')" @click.stop="toggle">
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" stroke="none" />
        <path v-if="!muted" d="M15 9.5a3.5 3.5 0 0 1 0 5" />
        <path v-if="!muted" d="M17.5 7a7 7 0 0 1 0 10" />
        <path v-if="muted" d="M3 3l18 18" />
      </svg>
    </button>
    <div v-if="showSpeed" class="speed_toggle" :class="{ on: options.fastBattle }" @click="toggleSpeed">
      <span>{{ T("options.fast") }}</span>
      <div class="switch"><div class="knob"></div></div>
    </div>
    <div v-if="open" ref="pop" class="volume_pop panel_glass pop_in" @click.stop>
      <div class="vol_title">{{ T("volume.title") }}</div>
      <div v-for="row in rows" :key="row.key" class="vol_row">
        <div class="vol_head">
          <span class="vol_label">{{ row.label }}</span>
          <button class="vol_step" @click="step(row.key, -5)">&lt;</button>
          <span class="vol_value">{{ percent(row.key) }}</span>
          <button class="vol_step" @click="step(row.key, 5)">&gt;</button>
        </div>
        <input
          class="vol_slider"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="percent(row.key)"
          :style="{ '--p': `${percent(row.key)}%` }"
          @input="set(row.key, $event.target.value, true)"
          @change="set(row.key, $event.target.value)"
        />
      </div>
      <div class="vol_foot">
        <button class="btn sub small" @click="close">{{ T("common.close") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 右上常駐 (tale): 音量ボタン (ポップオーバーで 全体 / BGM / SE) と 戦闘高速化トグル。設定は session.options (progress に永続化)
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";

defineProps({ showSpeed: { type: Boolean, default: true } });
const session = useSessionStore();
const options = computed(() => session.options);
const open = ref(false);
const pop = ref(null);
const rows = [
  { key: "masterVolume", label: T("volume.master") },
  { key: "bgmVolume", label: T("volume.bgm") },
  { key: "seVolume", label: T("volume.se") },
];
const muted = computed(() => options.value.masterVolume === 0 || (options.value.bgmVolume === 0 && options.value.seVolume === 0));
const percent = (k) => Math.round(options.value[k] * 100);

function toggle() {
  if (open.value) close();
  else {
    SoundManager.playSe("option");
    open.value = true;
  }
}
function close() {
  if (!open.value) return;
  open.value = false;
  SoundManager.playSe("cancel");
}
function set(k, pct, fromSlider = false) {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct))));
  session.setOptions({ [k]: p / 100 });
  if (k !== "bgmVolume" && !fromSlider) SoundManager.playSe("select");
}
function step(k, d) {
  set(k, percent(k) + d);
}
function toggleSpeed() {
  session.setOptions({ fastBattle: !options.value.fastBattle });
  SoundManager.playSe(options.value.fastBattle ? "ok" : "cancel");
}
function onOutside(e) {
  if (open.value && pop.value && !pop.value.contains(e.target)) close();
}
onMounted(() => window.addEventListener("pointerdown", onOutside, true));
onBeforeUnmount(() => window.removeEventListener("pointerdown", onOutside, true));
</script>

<style lang="scss" scoped>
.corner {
  position: absolute;
  top: 10px;
  right: 16px;
  z-index: 350;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.volume_btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(31, 27, 25, 0.85);
  border: 1px solid var(--color-base2);
  border-radius: var(--radius-round);
  color: var(--color-white3);
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
  &:hover {
    border-color: var(--color-main3);
    color: var(--color-main1);
  }
  &.muted {
    color: var(--color-negative1);
  }
}
.speed_toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: rgba(31, 27, 25, 0.85);
  border: 1px solid var(--color-base2);
  border-radius: var(--radius-round);
  font-size: var(--font-size-mini);
  color: var(--color-white3);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
  &:hover {
    border-color: var(--color-main3);
  }
  .switch {
    width: 34px;
    height: 18px;
    border-radius: var(--radius-round);
    background: var(--color-base3);
    border: 1px solid var(--color-base2);
    position: relative;
    transition: background 0.15s ease;
  }
  .knob {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 14px;
    height: 14px;
    border-radius: var(--radius-round);
    background: var(--color-white3);
    transition:
      left 0.15s ease,
      background 0.15s ease;
  }
  &.on {
    color: var(--color-main1);
    border-color: var(--color-main3);
    .switch {
      background: var(--color-main4);
    }
    .knob {
      left: 17px;
      background: var(--color-white0);
    }
  }
}
.volume_pop {
  position: absolute;
  top: 0;
  right: 40px;
  width: 280px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: default;
  .vol_title {
    color: var(--color-main1);
    font-size: var(--font-size-normal);
  }
  .vol_row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .vol_head {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vol_label {
    flex: 1;
    color: var(--color-white2);
    font-size: var(--font-size-small);
  }
  .vol_value {
    width: 34px;
    text-align: center;
    color: var(--color-white0);
    font-size: var(--font-size-small);
  }
  .vol_step {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-round);
    background: var(--color-base3);
    border: 1px solid var(--color-base2);
    color: var(--color-white2);
    font-size: var(--font-size-small);
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      border-color: var(--color-main3);
      color: var(--color-main1);
    }
  }
  .vol_foot {
    display: flex;
    justify-content: center;
    margin-top: 2px;
  }
}
.vol_slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
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
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }
}
</style>
