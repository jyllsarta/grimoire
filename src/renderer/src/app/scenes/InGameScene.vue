<template>
  <div class="ingame" :style="bgStyle">
    <!-- 左カラム: 章名 / 本名 / ライフ / コイン / 本の要求 / レリック / ステート -->
    <div class="left panel_glass">
      <div class="heading">{{ chapter.name }}</div>
      <div class="hint">{{ book.name }} / {{ T("ingame.chapter") }} {{ state.progress.chapterIndex + 1 }} / {{ chapterSequence(state).length }}</div>
      <div class="stat life">
        {{ T("ingame.life") }} <b>{{ state.player.hp }}</b> / {{ qq.derive("maxHp") }}
      </div>
      <div class="stat">
        {{ T("ingame.coin") }} <b>{{ state.wallet.coin }}</b>
      </div>
      <div class="stat hint">{{ T("ingame.harshness") }} {{ qq.derive("harshnessScore") }} / {{ book.harshnessThreshold }}</div>
      <div class="relics">
        <span v-for="r in state.relics" :key="r.uid" class="chip">{{ master.get("relics", r.defId).name }}</span>
      </div>
      <StatusChips :statuses="state.player.statuses" :unique="state.player.unique" :costume="state.player.costume" />
      <div class="rules hint">
        <div v-for="rule in rules" :key="rule.id">{{ rule.name }}: {{ rule.description }}</div>
      </div>
      <div class="deck hint">
        {{ T("ingame.deck") }} {{ state.board.deck.length }} ({{ deckText }})<span v-if="!state.board.boss.placed && !state.board.boss.defeated">
          + {{ T("ingame.boss") }}</span
        >
      </div>
      <button class="btn sub small giveup" @click="giveUp">{{ T("ingame.giveUp") }}</button>
    </div>

    <!-- 中央: 盤面 + インベントリ -->
    <div class="center">
      <div class="board" :style="{ '--w': state.board.width }">
        <div class="row_label hint">{{ T("panel.next") }}</div>
        <div class="row next">
          <div v-for="c in topCells" :key="c" class="panel_cell">
            <PanelCard v-if="panelAt(state, c)" :panel="panelAt(state, c)" :selectable="false" />
          </div>
        </div>
        <div class="row main">
          <div v-for="c in bottomCells" :key="c" class="panel_cell">
            <PanelCard
              v-if="panelAt(state, c)"
              :panel="panelAt(state, c)"
              :selectable="!state.battle"
              :selected="run.selectedCell === c"
              @select="run.select(c)"
            />
          </div>
        </div>
      </div>
      <div v-if="selectedPanel && !state.battle" class="peek panel_glass">
        <div class="heading">{{ panelName(selectedPanel) }}</div>
        <div class="hint">{{ panelDesc(selectedPanel) }}</div>
        <div class="actions">
          <template v-if="selectedPanel.kind === 'enemy'">
            <button class="btn" @click="cmd('startBattle', { cell: run.selectedCell })">{{ T("panel.fight") }}</button>
          </template>
          <template v-else-if="selectedPanel.kind === 'chapterClear'">
            <button class="btn" @click="cmd('takeChapterClear', { cell: run.selectedCell })">{{ T("panel.chapterClear") }}</button>
          </template>
          <template v-else-if="selectedPanel.kind === 'event'">
            <button
              v-for="(cid, i) in master.get('events', selectedPanel.defId).choiceIds"
              :key="cid"
              class="btn sub"
              @click="cmd('chooseEvent', { cell: run.selectedCell, choiceIndex: i })"
            >
              {{ master.get("eventChoices", cid).label }}
            </button>
          </template>
          <template v-else>
            <button class="btn" @click="cmd('takePanel', { cell: run.selectedCell })">{{ T("panel.take", { n: panelCost(selectedPanel) }) }}</button>
            <button class="btn sub" @click="cmd('dumpPanel', { cell: run.selectedCell })">{{ T("panel.dump") }}</button>
          </template>
        </div>
        <div v-if="message" class="hint error">{{ message }}</div>
      </div>
      <InventoryBar class="inventory" />
    </div>

    <!-- 右: 立ち絵 -->
    <div class="figure">
      <CharacterFigure :character-id="state.characterId" :face-id="faceId" />
    </div>

    <!-- 戦闘パネル (下から生える) -->
    <transition name="rise">
      <BattlePanel v-if="state.battle" class="battle" @message="message = $event" />
    </transition>

    <!-- 保留 (インベントリあふれ) -->
    <div v-if="pending" class="pending_backdrop">
      <div class="pending panel_glass">
        <div class="heading">{{ T("pending.heading") }}</div>
        <div>{{ defOf(pending.entity).name }}</div>
        <div class="actions">
          <button v-if="packedArrangement" class="btn" @click="cmd('resolvePending', { index: 0, arrangement: packedArrangement })">
            つめて受け取る
          </button>
          <button class="btn sub" @click="cmd('resolvePending', { index: 0, discard: true })">{{ T("pending.discard") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// インゲーム (07 InGame)。tale のレイアウト v2 の骨格: 立ち絵右、左カラム、盤面、インベントリ帯、下から生える戦闘パネル。
// 全部 state を直接読んで描き、書くのは run.dispatch だけ。見た目は M3 で詰める
// ============================================================
import { computed, onMounted, ref, watch } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { master } from "@core/master/index.js";
import { q, panelAt, chapterSequence, currentChapter, deckSummary } from "@core/queries/index.js";
import { defOf, entitySize } from "@core/domain/entity.js";
import { T, reasonText } from "../text.js";
import StatusChips from "../components/StatusChips.vue";
import CharacterFigure from "../components/CharacterFigure.vue";
import InventoryBar from "../components/InventoryBar.vue";
import PanelCard from "../components/PanelCard.vue";
import BattlePanel from "../components/BattlePanel.vue";

const session = useSessionStore();
const run = useRunStore();
const state = computed(() => run.state);
const qq = computed(() => q(run.state));
const chapter = computed(() => currentChapter(run.state));
const book = computed(() => master.get("books", run.state.bookId));
const rules = computed(() => master.where("bookRules", "bookId", run.state.bookId));
const message = ref("");
const faceId = ref(2);

const topCells = computed(() => [...Array(run.state.board.width).keys()].map((i) => i + run.state.board.width));
const bottomCells = computed(() => [...Array(run.state.board.width).keys()]);
const selectedPanel = computed(() => (run.selectedCell == null ? null : panelAt(run.state, run.selectedCell)));
const deckText = computed(() =>
  Object.entries(deckSummary(run.state))
    .map(([k, n]) => `${k} ${n}`)
    .join(" / "),
);
const pending = computed(() => run.state.progress.pending[0] ?? null);
const bgStyle = computed(() => ({ "--bg": `url(assets/backgrounds/${chapter.value.battleBg}.png)` }));

// 保留物を「全部左につめる」配置で入るなら、その arrangement (入らなければ null)
const packedArrangement = computed(() => {
  if (!pending.value) return null;
  const slotCount = qq.value.derive("slotCount");
  const all = [...run.state.inventory.entities, pending.value.entity];
  let pos = 0;
  const arrangement = [];
  for (const e of all) {
    arrangement.push({ uid: e.uid, pos });
    pos += entitySize(e);
  }
  return pos <= slotCount ? arrangement : null;
});

onMounted(() => session.setBgm(chapter.value.bgmId || "chara1"));
watch(
  () => chapter.value.id,
  () => session.setBgm(chapter.value.bgmId || "chara1"),
);
watch(
  () => run.lastEvents,
  (events) => {
    if (events.some((e) => e.type === "playerDamage" && e.payload.hpLoss > 0)) faceId.value = 14;
    else if (events.some((e) => e.type === "victory")) faceId.value = 31;
    else if (events.some((e) => e.type === "battleStart")) faceId.value = 15;
  },
);

function panelName(p) {
  if (p.kind === "chapterClear") return T("panel.chapterClear");
  return defOf(p).name;
}
function panelDesc(p) {
  if (p.kind === "chapterClear") return "";
  if (p.kind === "enemy") return `${T("ingame.life")} ${p.enemy.hp} / ${qq.value.derive("enemyMaxHp", { defId: p.defId })}`;
  return defOf(p).description;
}
function panelCost(p) {
  return qq.value.derive("panelCost", { def: defOf(p), panel: p });
}
function cmd(name, args) {
  const r = run.dispatch(name, args);
  message.value = r.ok ? "" : reasonText(r.reason);
  if (r.ok && name !== "startBattle") run.selectedCell = null;
}
function giveUp() {
  if (confirm("このランをあきらめますか? (戦績には数えません)")) run.dispatch("giveUp");
}
</script>

<style lang="scss" scoped>
.ingame {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(31, 27, 25, 0.75), rgba(31, 27, 25, 0.9)),
    var(--bg) center / cover;
  .left {
    position: absolute;
    left: 16px;
    top: 16px;
    width: 300px;
    bottom: 16px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .stat b {
      font-size: var(--font-size-large);
      color: var(--color-main1);
    }
    .life b {
      color: var(--shape-life);
    }
    .relics {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .deck,
    .rules {
      white-space: normal;
    }
    .giveup {
      margin-top: auto;
      align-self: flex-start;
    }
  }
  .center {
    position: absolute;
    left: 336px;
    top: 16px;
    width: 600px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .board {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .row {
      display: grid;
      grid-template-columns: repeat(var(--w), 150px);
      gap: 12px;
    }
    .next {
      opacity: 0.75;
      transform: scale(0.92);
      transform-origin: left top;
    }
    .panel_cell {
      height: 150px;
    }
  }
  .peek {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .error {
      color: var(--color-negative1);
    }
  }
  .inventory {
    margin-top: auto;
  }
  .figure {
    position: absolute;
    right: -40px;
    top: 40px;
    width: 400px;
    height: 700px;
    pointer-events: none;
    filter: drop-shadow(6px 10px 6px #000);
  }
  .battle {
    position: absolute;
    left: 336px;
    bottom: 120px;
    width: 600px;
    z-index: 10;
  }
  .rise-enter-active,
  .rise-leave-active {
    transition:
      transform 0.25s ease,
      opacity 0.25s ease;
  }
  .rise-enter-from,
  .rise-leave-to {
    transform: translateY(60px);
    opacity: 0;
  }
  .pending_backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    .pending {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      .actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
