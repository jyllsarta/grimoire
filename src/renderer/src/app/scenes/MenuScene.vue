<template>
  <div class="menu">
    <div class="left">
      <div class="heading">{{ T("menu.heading") }}</div>
      <div class="cards">
        <button v-for="c in heroineList" :key="c.id" class="card panel_glass" :class="{ selected: c.id === selected }" @click="select(c.id)">
          <div class="figure"><CharacterFigure :character-id="c.id" :face-id="2" /></div>
          <div class="name">{{ c.name }}</div>
          <div class="hint">{{ c.asKnownAs }}</div>
        </button>
      </div>
      <button class="btn sub small back" @click="session.setScene('title')">{{ T("common.back") }}</button>
    </div>
    <div v-if="selected != null" class="right panel_glass">
      <div class="heading">{{ T("book.heading") }}</div>
      <div v-for="b in books" :key="b.id" class="book">
        <div class="book_name">{{ b.name }}</div>
        <div class="hint">{{ b.description }}</div>
        <div class="record hint">
          {{ recordText(b.id) }}
        </div>
        <div class="row">
          <button class="btn" @click="start(b.id)">{{ T("book.start") }}</button>
          <button v-if="session.hasRunSave" class="btn sub" @click="resume">{{ T("title.continue") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { heroines, booksOf } from "@core/queries/index.js";
import { T } from "../text.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import SoundManager from "../sound/sound_manager.js";

const session = useSessionStore();
const run = useRunStore();
const heroineList = heroines();
const selected = ref(heroineList[0]?.id ?? null);
const books = computed(() => (selected.value == null ? [] : booksOf(selected.value)));

onMounted(() => session.setBgm("title"));

function select(id) {
  SoundManager.playSe("select");
  selected.value = id;
}

function recordText(bookId) {
  const r = session.record(selected.value, bookId);
  return `挑戦 ${r.tries} / ノーマル ${r.normalEnds} / ハッピー ${r.happyEnds} / 敗北 ${r.losses}${r.bestDelta != null ? ` / ベスト変動値 ${r.bestDelta}` : ""}`;
}

function start(bookId) {
  SoundManager.playSe("gameStart");
  const c = session.characterProgress(selected.value);
  // スターパレットは M3。いまは有効ノードのスナップショットだけ渡す (効果は starNodes から組む)
  run.start({ characterId: selected.value, bookId, star: { activeNodeIds: c.star.activeNodeIds, delta: 0, effects: [] } });
  session.setScene("inGame");
}

async function resume() {
  SoundManager.playSe("ok");
  const state = await run.resume();
  if (state) session.setScene("inGame");
}
</script>

<style lang="scss" scoped>
.menu {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 24px;
  padding: 32px 48px;
  background: radial-gradient(ellipse at 30% 30%, var(--color-base4), var(--color-base5) 70%);
  .left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .cards {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .card {
    width: 220px;
    padding: 12px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    &.selected {
      border-color: var(--color-main2);
    }
    .figure {
      width: 196px;
      height: 200px;
      overflow: hidden;
      border-radius: var(--radius-card);
      background: var(--color-base5);
    }
    .name {
      font-size: var(--font-size-medium);
      color: var(--color-main1);
    }
  }
  .back {
    align-self: flex-start;
  }
  .right {
    width: 420px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .book {
    display: flex;
    flex-direction: column;
    gap: 6px;
    .book_name {
      font-size: var(--font-size-medium);
    }
    .row {
      display: flex;
      gap: 12px;
      margin-top: 6px;
    }
  }
}
</style>
