<template>
  <DialogFrame :width="640" dialog-class="difficulty_dialog" :z-index="650">
    <Ornament kind="head" :title="T('difficulty.heading')" />
    <div class="diff_note">{{ T("difficulty.note") }}</div>
    <div class="diff_buttons">
      <button v-for="d in DIFFICULTIES" :key="d" class="diff_btn" :class="d" @click="choose(d)">
        <div class="diff_name">{{ T(`difficulty.${d}`) }}</div>
        <div class="diff_desc hint">{{ T(`difficulty.${d}.desc`) }}</div>
      </button>
    </div>
    <div class="diff_hint hint">{{ T("difficulty.hint") }}</div>
  </DialogFrame>
</template>

<script setup>
// 難易度プリセット (07 R1 Q28): 初回起動時に尋ねる。全ヒロインの starPresets を有効化する (normal は全部オフ)
import { useSessionStore } from "../stores/session.js";
import { heroines } from "@core/queries/index.js";
import { applyPreset } from "@core/star/palette.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const DIFFICULTIES = ["easy", "normal", "hard"];
const emit = defineEmits(["close"]);
const session = useSessionStore();

async function choose(difficulty) {
  SoundManager.playSe("ok2");
  for (const c of heroines()) {
    const progress = session.characterProgress(c.id);
    let ids = [];
    try {
      ids = applyPreset(c.id, difficulty, progress);
    } catch (e) {
      console.warn(e.message);
    }
    await session.setActiveNodeIds(c.id, ids, difficulty);
  }
  await session.setFlag("difficultyChosen", true);
  emit("close", difficulty);
}
</script>

<style lang="scss" scoped>
:deep(.difficulty_dialog) {
  padding: 26px 34px 22px;
}
.diff_note {
  margin-top: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.diff_buttons {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  .diff_btn {
    flex: 1;
    padding: 16px 12px;
    border-radius: var(--radius-card);
    background: linear-gradient(165deg, var(--color-base2), var(--color-base4));
    border: 2px solid var(--color-base1);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    transition:
      filter 0.1s ease,
      transform 0.1s ease;
    &:hover {
      filter: brightness(1.12);
      transform: translateY(-2px);
    }
    .diff_name {
      font-size: var(--font-size-medium);
      color: var(--color-main1);
    }
    .diff_desc {
      white-space: normal;
      text-align: center;
      line-height: 1.5;
    }
    &.easy {
      border-color: var(--color-accent4);
    }
    &.hard {
      border-color: var(--color-negative2);
    }
  }
}
.diff_hint {
  margin-top: 14px;
  text-align: center;
  white-space: normal;
}
</style>
