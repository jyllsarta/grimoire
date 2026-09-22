<template>
  <div class="title">
    <div class="logo">
      <div class="name">オラクルちゃんと呪いの本</div>
      <div class="hint">M1 スキャフォールド / {{ edition.version }} {{ edition.name }}</div>
    </div>
    <div class="buttons">
      <button class="btn" @click="start">{{ T("title.start") }}</button>
      <button class="btn sub" :disabled="!session.hasRunSave" @click="resume">{{ T("title.continue") }}</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { edition } from "@platform/edition.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";

const session = useSessionStore();
const run = useRunStore();

onMounted(() => session.setBgm("title"));

function start() {
  SoundManager.playSe("ok");
  session.setScene("menu");
}

async function resume() {
  SoundManager.playSe("ok");
  const state = await run.resume();
  if (state) session.setScene("inGame");
}
</script>

<style lang="scss" scoped>
.title {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  background: radial-gradient(ellipse at 50% 40%, var(--color-base3), var(--color-base5) 70%);
  .logo .name {
    font-size: var(--font-size-3xlarge);
    color: var(--color-main1);
    text-shadow: var(--shadow-card);
    letter-spacing: 0.08em;
  }
  .logo .hint {
    text-align: center;
    margin-top: 8px;
  }
  .buttons {
    display: flex;
    gap: 24px;
  }
}
</style>
