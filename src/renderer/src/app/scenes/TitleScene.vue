<template>
  <div class="title scene">
    <div class="scene_bg dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>
    <div class="title_figure trans_right_in"><CharacterFigure :character-id="keyVisualId" :face-id="2" /></div>
    <div class="title_logo_area trans_drop_in">
      <div class="title_logo">{{ master.config.title }}</div>
      <Ornament kind="head" variant="event" class="title_sub" :title="T('title.subtitle')" />
    </div>
    <div v-hover-se class="title_menu trans_raise_in delay_2">
      <button class="btn big" @click="start">{{ T("title.start") }}</button>
      <button class="btn sub" :disabled="!session.hasRunSave" @click="resume">{{ T("title.continue") }}</button>
      <div class="title_row">
        <button class="btn sub small" @click="open('options')">{{ T("title.options") }}</button>
        <button class="btn sub small" @click="open('savedata')">{{ T("title.savedata") }}</button>
        <button class="btn sub small" @click="open('credits')">{{ T("title.credits") }}</button>
      </div>
    </div>
    <div class="title_note hint">{{ edition.name }} / v{{ edition.version }}</div>
  </div>
</template>

<script setup>
// タイトル (07): はじめる / つづきから / オプション / セーブ管理 / クレジット。初回は オープニング → 難易度
import { onMounted } from "vue";
import { useSessionStore } from "../stores/session.js";
import { master } from "@core/master/index.js";
import { heroines } from "@core/queries/index.js";
import { edition } from "@platform/edition.js";
import { startFromTitle, resumeRun } from "../flow/title.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Ornament from "../components/Ornament.vue";

const session = useSessionStore();
const keyVisualId = heroines()[0]?.id ?? 0;

onMounted(() => session.setBgm("title"));

async function start() {
  SoundManager.playSe("ok");
  await startFromTitle();
}
async function resume() {
  SoundManager.playSe("ok");
  await resumeRun();
}
function open(name) {
  SoundManager.playSe("open");
  session.openDialog(name);
}
</script>

<style lang="scss" scoped>
.title {
  overflow: hidden;
  .title_figure {
    position: absolute;
    left: 640px;
    top: -20px;
    width: 800px;
    height: 1200px;
    opacity: 0.95;
  }
  .title_logo_area {
    position: absolute;
    left: 60px;
    top: 120px;
    width: 620px;
    text-align: center;
    .title_logo {
      font-size: 64px;
      color: var(--color-main0);
      text-shadow:
        0 4px 0 var(--color-base4),
        0 0 26px rgba(255, 228, 178, 0.45),
        0 10px 30px rgba(0, 0, 0, 0.85);
      letter-spacing: 0.08em;
      line-height: 1.2;
    }
    .title_sub {
      max-width: 520px;
      margin: 14px auto 0;
    }
  }
  .title_menu {
    position: absolute;
    left: 60px;
    width: 620px;
    top: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    .title_row {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
  }
  .title_note {
    position: absolute;
    right: 16px;
    bottom: 12px;
  }
}
</style>
