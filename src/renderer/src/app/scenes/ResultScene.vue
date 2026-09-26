<template>
  <div class="result scene" :class="`ending_${state.progress.ending}`">
    <div class="scene_bg strong_dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>
    <div class="result_figure trans_right_in"><CharacterFigure :character-id="state.characterId" :face-id="figureFace" /></div>
    <div v-hover-se class="result_dialog panel_glass orn_frame trans_raise_in">
      <Ornament kind="head" variant="big" :class="{ bad: state.progress.ending === 'lose' }" :title="endingText" />
      <div class="result_book hint">{{ book.name }}</div>
      <div class="result_body">
        <div class="result_row">
          <span>{{ T("result.chapters", { n: reached, m: total }) }}</span>
        </div>
        <div class="result_row">
          <span>{{ T("result.harshness", { n: harshness }) }}</span
          ><span class="hint">/ {{ book.harshnessThreshold }}</span>
        </div>
        <div class="result_row hint">{{ T("result.stats", { t: state.counters.turns, k: state.counters.kills, f: state.counters.flees }) }}</div>
      </div>
      <div class="star_result_box">
        <div class="star_result_delta">
          <span>{{ T("result.delta") }}</span
          ><b :class="deltaClass(state.star.delta)">{{ signedDelta(state.star.delta) }}</b
          ><i v-if="isBest">{{ T("result.best") }}</i>
        </div>
        <div class="star_result_nodes">
          <span v-for="n in activeNodes" :key="n.id" class="star_result_node" :class="{ down: n.delta < 0 }" :title="n.name">
            <svg class="star_base" viewBox="0 0 64 64"><path :d="starBasePath(n.kind)" /></svg>
            <Shape class="star_icon" :kind="starShapeOf(n)" :text="null" size="tiny" />
          </span>
          <span v-if="!activeNodes.length" class="hint">{{ T("result.noNodes") }}</span>
        </div>
        <div class="star_result_crowns"><img :src="CROWN_ICON" alt="" />{{ T("result.crowns", { n: state.star.crownsGained }) }}</div>
      </div>
      <div class="result_seed hint">{{ T("result.seed", { n: state.rng.seed }) }}</div>
      <div class="result_buttons">
        <button v-if="sceneSkit" class="btn sub" @click="replay">{{ T("result.replaySkit") }}</button>
        <button class="btn" @click="toMenu">{{ T("result.toMenu") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// リザルト (07): ノーマル / ハッピー / 敗北。変動値、有効ノード、獲得クラウン、過酷さ。scene 形式のスキットはここから再生
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { master } from "@core/master/index.js";
import { chapterSequence, q } from "@core/queries/index.js";
import { nodesOf } from "@core/star/palette.js";
import { skitFor, playSkit } from "../flow/skits.js";
import { starShapeOf, starBasePath, deltaClass, signedDelta } from "../ui/star_view.js";
import { CROWN_ICON } from "../ui/entity_view.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

const session = useSessionStore();
const run = useRunStore();
const state = computed(() => run.state);
const book = computed(() => master.get("books", run.state.bookId));
const ending = computed(() => run.state.progress.ending);
const endingText = computed(
  () => ({ normal: T("result.normal"), happy: T("result.happy"), lose: T("result.lose") })[ending.value] ?? T("result.abandoned"),
);
const figureFace = computed(() => ({ normal: 31, happy: 31, lose: 14 })[ending.value] ?? 1);
const total = computed(() => chapterSequence(run.state).length);
const reached = computed(() => Math.min(total.value, run.state.counters.chaptersCleared));
const harshness = computed(() => q(run.state).derive("harshnessScore"));
const activeNodes = computed(() => nodesOf(run.state.characterId).filter((n) => n.kind === "node" && run.state.star.activeNodeIds.includes(n.id)));
const isBest = computed(() => {
  const r = session.record(run.state.characterId, run.state.bookId);
  return (ending.value === "normal" || ending.value === "happy") && r.bestDelta === run.state.star.delta && r.normalEnds + r.happyEnds <= 1;
});
// 完走スキットは本の持ち主、敗北スキットは挑戦中のヒロイン
const sceneSkit = computed(() => {
  const trigger = { normal: "normalEnd", happy: "happyEnd", lose: "lose" }[ending.value];
  if (!trigger) return null;
  return skitFor(trigger, trigger === "lose" ? run.state.characterId : book.value.characterId);
});
const played = ref(false);

onMounted(async () => {
  session.setBgm("result");
  if (sceneSkit.value && !played.value) {
    played.value = true;
    await playSkit(sceneSkit.value.id);
  }
});
function replay() {
  SoundManager.playSe("ok");
  playSkit(sceneSkit.value.id);
}
function toMenu() {
  SoundManager.playSe("ok");
  const cid = run.state.characterId;
  run.clear();
  session.setScene("bookSelect", { characterId: cid });
}
</script>

<style lang="scss" scoped>
.result {
  overflow: hidden;
  .result_figure {
    position: absolute;
    left: 720px;
    top: -30px;
    width: 720px;
    height: 1080px;
    pointer-events: none;
    opacity: 0.9;
  }
  .result_dialog {
    position: absolute;
    left: 90px;
    top: 70px;
    width: 620px;
    padding: 40px 48px;
    text-align: center;
    z-index: 2;
  }
  .result_book {
    margin-top: 6px;
  }
  .result_body {
    margin-top: 18px;
    line-height: 1.8;
    color: var(--color-white2);
    .result_row {
      display: flex;
      justify-content: center;
      gap: 8px;
      align-items: baseline;
    }
  }
  .star_result_box {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: var(--radius-card);
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid var(--color-base3);
  }
  .star_result_delta {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 10px;
    span {
      color: var(--color-white3);
      font-size: var(--font-size-small);
    }
    b {
      font-size: var(--font-size-2xlarge);
      color: var(--color-white);
      line-height: 1;
      font-weight: normal;
      &.neg {
        color: var(--color-negative1);
      }
      &.pos {
        color: var(--color-accent3);
      }
    }
    i {
      font-style: normal;
      color: var(--color-main1);
      font-size: var(--font-size-small);
    }
  }
  .star_result_nodes {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .star_result_node {
    position: relative;
    width: 36px;
    height: 36px;
    display: inline-block;
    .star_base {
      width: 100%;
      height: 100%;
      fill: var(--color-base3);
      stroke: var(--color-main2);
      stroke-width: 3;
    }
    &.down .star_base {
      stroke: var(--color-negative1);
    }
    .star_icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .star_result_crowns {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--color-main1);
    font-size: var(--font-size-small);
    img {
      width: 18px;
      height: 18px;
    }
  }
  .result_seed {
    margin-top: 10px;
  }
  .result_buttons {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    gap: 16px;
  }
}
</style>
