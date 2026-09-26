<template>
  <div class="ingame scene" :class="{ in_battle: !!state.battle }">
    <div class="scene_bg dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>

    <!-- 立ち絵 (右) と吹き出し -->
    <div class="heroine_area">
      <CharacterFigure :character-id="state.characterId" follow-talk />
    </div>
    <div class="baloon_area">
      <Baloon :message="talk.message" :updated-at="talk.updatedAt" mirror-frame />
    </div>

    <!-- 左カラム -->
    <ChapterHead class="chapter_head_pos trans_left_in" />
    <DeckSummary class="deck_pos trans_left_in delay_1" />
    <LifePanel class="life_pos trans_left_in delay_2" />

    <!-- 左下: SD の駒 -->
    <div class="sd_hero" :class="{ away: !!state.battle }">
      <SdPiece :character-id="state.characterId" :player="state.player" :size="400" />
    </div>

    <!-- 盤面 -->
    <BoardPanel
      class="board_pos trans_raise_in delay_1"
      :selectable="!state.battle && !session.dialogs.length"
      :dimmed="!!state.battle"
      @select="onPanelSelect"
    />

    <!-- インベントリ帯 -->
    <InventoryBar class="inventory_pos trans_raise_in delay_2" />

    <!-- 戦闘レイヤー (下から生える) -->
    <transition name="battle">
      <BattleLayer v-if="state.battle" @message="flash" />
    </transition>

    <div class="damage_flash" :class="{ on: flashOn }"></div>
    <div v-if="message" class="ingame_message">{{ message }}</div>
  </div>
</template>

<script setup>
// ============================================================
// インゲーム (07 InGame、tale のレイアウト v2): 立ち絵右、左カラム、盤面、インベントリ帯、下から生える戦闘パネル。
// 全部 state を直接読んで描き、書くのは run.dispatch だけ。ダイアログは session.openDialog
// ============================================================
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { useTalkStore } from "../stores/talk.js";
import { master } from "@core/master/index.js";
import { panelAt, currentChapter } from "@core/queries/index.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import { playSkitFor } from "../flow/skits.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Baloon from "../components/Baloon.vue";
import ChapterHead from "../components/ChapterHead.vue";
import DeckSummary from "../components/DeckSummary.vue";
import LifePanel from "../components/LifePanel.vue";
import SdPiece from "../components/SdPiece.vue";
import BoardPanel from "../components/BoardPanel.vue";
import InventoryBar from "../components/InventoryBar.vue";
import BattleLayer from "../components/BattleLayer.vue";

const session = useSessionStore();
const run = useRunStore();
const talk = useTalkStore();
const state = computed(() => run.state);
const chapter = computed(() => currentChapter(run.state));
const message = ref("");
const flashOn = ref(false);
let messageTimer = null;
let idleTimer = null;
let bossSkitChapter = -1;

function flash(text) {
  if (!text) return;
  message.value = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (message.value = ""), 1800);
}

function onPanelSelect(cell) {
  const panel = panelAt(run.state, cell);
  if (!panel) return;
  SoundManager.playSe("select");
  if (panel.kind === "enemy") {
    const r = run.dispatch("startBattle", { cell });
    if (!r.ok) flash(reasonText(r.reason));
    else talk.say("peekEnemy");
  } else if (panel.kind === "event") {
    talk.say("peekEvent");
    session.openDialog("event", { cell });
  } else if (panel.kind === "chapterClear") {
    onChapterClear(cell);
  } else {
    talk.say("peekTreasure");
    session.openDialog("panelPeek", { cell });
  }
}

async function onChapterClear(cell) {
  SoundManager.playSe("ok2");
  const bookId = run.state.bookId;
  const stageBefore = run.state.progress.stage;
  const lastMain = run.state.progress.chapterIndex === master.get("books", bookId).chapterIds.length - 1 && stageBefore === "main";
  const r = run.dispatch("takeChapterClear", { cell });
  if (!r.ok) {
    flash(reasonText(r.reason));
    return;
  }
  talk.say("chapterClear", { hop: true });
  if (lastMain) await playSkitFor("bookClear", master.get("books", bookId).characterId);
  if (run.state.progress.stage === "extra" && stageBefore === "main") await playSkitFor("extraStart", master.get("books", bookId).characterId);
}

// 演出: 章の開始 / ボス出現 / 保留 (インベントリあふれ)
watch(
  () => run.lastEvents,
  async (events) => {
    if (events.some((e) => e.type === "playerDamage" && e.payload.hpLoss > 0)) {
      flashOn.value = false;
      requestAnimationFrame(() => (flashOn.value = true));
      setTimeout(() => (flashOn.value = false), 500);
    }
    if (events.some((e) => e.type === "bossAppear") && bossSkitChapter !== run.state.progress.chapterIndex) {
      bossSkitChapter = run.state.progress.chapterIndex;
      await playSkitFor("bossBefore", master.get("books", run.state.bookId).characterId);
    }
    if (events.some((e) => e.type === "chapterBuild")) talk.say("chapterStart", { hop: true });
    if (events.some((e) => e.type === "pendingGain") && run.state.progress.pending.length && !session.isDialogOpen("organize")) {
      talk.say("inventoryFull");
      SoundManager.playSe("ng");
      session.openDialog("organize", { mode: "pending" });
    }
    if (events.some((e) => e.type === "eventChoose")) talk.say("eventResult");
  },
);

// 毒中はげっそり顔 (talk の既定の表情)
watch(
  () => run.state?.player.statuses.some((s) => s.key === "poison"),
  (poisoned) => talk.setBaseFace(poisoned ? 14 : 1),
  { immediate: true },
);

function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!run.state?.battle && !session.dialogs.length) talk.say("idle");
    resetIdle();
  }, 22000);
}

onMounted(() => {
  session.setBgm(chapter.value.bgmId || "chara1");
  talk.bind(run.state.characterId);
  resetIdle();
  window.addEventListener("pointerdown", resetIdle, true);
  // 保留があるまま再開したとき
  if (run.state.progress.pending.length && !session.isDialogOpen("organize")) session.openDialog("organize", { mode: "pending" });
});
onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  clearTimeout(messageTimer);
  window.removeEventListener("pointerdown", resetIdle, true);
});
watch(
  () => chapter.value.id,
  () => session.setBgm(chapter.value.bgmId || "chara1"),
);
void T;
</script>

<style lang="scss" scoped>
.ingame {
  overflow: hidden;
  .heroine_area {
    position: absolute;
    left: 700px;
    top: -36px;
    width: 780px;
    height: 1170px;
    pointer-events: none;
    z-index: 5;
  }
  .baloon_area {
    position: absolute;
    left: 640px;
    top: 20px;
    width: 320px;
    min-height: 96px;
    max-height: 200px;
    z-index: 260;
    pointer-events: none;
  }
  .chapter_head_pos {
    position: absolute;
    left: 22px;
    top: 12px;
    z-index: 10;
  }
  .deck_pos {
    position: absolute;
    left: 16px;
    top: 92px;
    width: 250px;
    z-index: 10;
  }
  .life_pos {
    position: absolute;
    left: 16px;
    top: 166px;
    width: 250px;
    z-index: 10;
  }
  .sd_hero {
    position: absolute;
    left: -90px;
    bottom: -60px;
    z-index: 25;
    transition:
      transform 0.24s ease-out,
      opacity 0.24s ease-out;
    &.away {
      transform: translateX(-140px);
      opacity: 0;
    }
  }
  .board_pos {
    position: absolute;
    left: 300px;
    top: 128px;
    z-index: 8;
  }
  .inventory_pos {
    position: absolute;
    left: 240px;
    width: 730px;
    top: 560px;
    bottom: -40px;
    z-index: 30;
  }
  &.in_battle .inventory_pos {
    z-index: 230;
  }
  .damage_flash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 30%, var(--color-negative3) 100%);
    opacity: 0;
    z-index: 300;
    &.on {
      animation: flash_red 0.45s ease both;
    }
  }
  .ingame_message {
    position: absolute;
    left: 50%;
    top: 100px;
    transform: translateX(-50%);
    padding: 6px 18px;
    border-radius: var(--radius-round);
    background: rgba(31, 27, 25, 0.9);
    border: 1px solid var(--color-negative2);
    color: var(--color-negative1);
    z-index: 400;
    pointer-events: none;
  }
}
@keyframes flash_red {
  0% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
  }
}
</style>
