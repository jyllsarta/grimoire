<template>
  <div class="result">
    <div class="panel panel_glass">
      <div class="ending">{{ endingText }}</div>
      <div class="rows">
        <div>{{ T("ingame.chapter") }}: {{ state.progress.chapterIndex + 1 }} / {{ chapterSequence(state).length }}</div>
        <div>{{ T("ingame.harshness") }}: {{ q(state).derive("harshnessScore") }}</div>
        <div>クラウン: +{{ state.star.crownsGained }}</div>
        <div>ターン {{ state.counters.turns }} / 撃破 {{ state.counters.kills }} / 逃走 {{ state.counters.flees }}</div>
        <div class="hint">seed {{ state.rng.seed }} / 変動値 {{ state.star.delta }}</div>
      </div>
      <button class="btn" @click="toMenu">{{ T("result.toMenu") }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { chapterSequence, q } from "@core/queries/index.js";
import { T } from "../text.js";

const session = useSessionStore();
const run = useRunStore();
const state = computed(() => run.state);
const endingText = computed(() => {
  switch (state.value.progress.ending) {
    case "normal":
      return T("result.normal");
    case "happy":
      return T("result.happy");
    case "lose":
      return T("result.lose");
    default:
      return T("result.abandoned");
  }
});

onMounted(() => session.setBgm("result"));

function toMenu() {
  run.clear();
  session.setScene("menu");
}
</script>

<style lang="scss" scoped>
.result {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 50%, var(--color-base3), var(--color-base5) 70%);
  .panel {
    width: 520px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }
  .ending {
    font-size: var(--font-size-2xlarge);
    color: var(--color-main1);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }
}
</style>
