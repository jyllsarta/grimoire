<template>
  <div></div>
</template>

<script setup>
// ============================================================
// StepMover (01): battle.step を watch し、そのステップで出た一発物の待ち時間 (app/battle/delays.js) だけ待ってから
// dispatch("advance") を打つ。select か battle.end に着くまで繰り返す。xqueens の PhaseMover 相当。
// 世代カウンタ (epoch) で古いタイマーを捨てる。
// ============================================================
import { watch, onBeforeUnmount } from "vue";
import { useRunStore, onDispatched } from "./stores/run.js";
import { useSessionStore } from "./stores/session.js";
import { isAdvanceable } from "@core/timeline/steps.js";
import { delayFor } from "./battle/delays.js";

const run = useRunStore();
const session = useSessionStore();
let timer = null;
let lastEvents = [];

const stop = onDispatched(({ events }) => {
  lastEvents = events;
});

function schedule() {
  const epoch = run.epoch;
  const state = run.state;
  if (!state?.battle || !isAdvanceable(state.battle.step)) return;
  const delay = delayFor(lastEvents, session.speed);
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (run.epoch !== epoch || !run.state?.battle || !isAdvanceable(run.state.battle.step)) return;
    run.dispatch("advance");
  }, delay);
}

watch(
  () => [run.epoch, run.state?.battle?.step, run.state?.battle?.cursor],
  () => schedule(),
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimeout(timer);
  stop();
});
</script>
