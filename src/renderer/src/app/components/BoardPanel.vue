<template>
  <div class="board_panel panel_glass" :class="{ dimmed }">
    <div class="coin_gem" data-tips="coin">
      <span class="gem_value">{{ state.wallet.coin }}</span>
    </div>
    <div class="board_area">
      <div class="board_row next_row">
        <div class="board_row_label">{{ T("panel.next") }}</div>
        <div v-for="c in topCells" :key="c" class="panel_cell" :class="{ empty: !panelAt(state, c) }">
          <PanelCard v-if="panelAt(state, c)" :panel="panelAt(state, c)" :cell="c" :anim="animOf(c)" tips="next" />
        </div>
      </div>
      <div class="board_row" :class="{ selectable }">
        <div v-for="c in bottomCells" :key="c" class="panel_cell" :class="{ empty: !panelAt(state, c) }">
          <PanelCard
            v-if="panelAt(state, c)"
            :panel="panelAt(state, c)"
            :cell="c"
            :selectable="selectable"
            :anim="animOf(c)"
            @select="$emit('select', c)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 盤面パネル (tale board_panel): 幅 572 x 高さ 416、内側 24px。上段 = ネクスト、下段 = えらぶ。コインの宝石は左上に重ねる
import { computed, ref, watch } from "vue";
import { panelAt } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { T } from "../text.js";
import PanelCard from "./PanelCard.vue";

const props = defineProps({
  selectable: { type: Boolean, default: true },
  dimmed: { type: Boolean, default: false },
});
defineEmits(["select"]);
const run = useRunStore();
const state = computed(() => run.state);
const topCells = computed(() => [...Array(run.state.board.width).keys()].map((i) => i + run.state.board.width));
const bottomCells = computed(() => [...Array(run.state.board.width).keys()]);

// 落下 / 補充のアニメ (outbox の panelFall / panelRefill)。次の描画までの一瞬だけ付ける
const anims = ref({});
watch(
  () => run.lastEvents,
  (events) => {
    const next = {};
    for (const e of events) {
      if (e.type === "panelFall") next[e.payload.to] = "fall";
      if (e.type === "panelRefill" || e.type === "bossAppear") next[e.payload.cell] = "spawn";
    }
    anims.value = next;
    if (Object.keys(next).length) setTimeout(() => (anims.value = {}), 400);
  },
);
const animOf = (c) => anims.value[c] || "";
void props;
</script>

<style lang="scss" scoped>
.board_panel {
  position: relative;
  width: 572px;
  height: 416px;
  padding: 24px;
  transition:
    filter 0.25s ease,
    transform 0.25s ease;
  &.dimmed {
    filter: brightness(0.45);
    transform: scale(0.97);
  }
  .board_area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    height: 100%;
  }
  .board_row {
    display: flex;
    gap: 14px;
    position: relative;
    &.next_row :deep(.panel_card) {
      filter: brightness(0.62) saturate(0.8);
    }
  }
  .board_row_label {
    position: absolute;
    right: 4px;
    top: -18px;
    color: var(--color-white3);
    font-size: var(--font-size-mini);
  }
  .panel_cell {
    width: 165px;
    height: 165px;
    position: relative;
    &.empty::after {
      content: "";
      position: absolute;
      inset: 6px;
      border: 2px dashed var(--color-base2);
      border-radius: var(--radius-card);
    }
  }
  .coin_gem {
    position: absolute;
    left: -26px;
    top: -26px;
    width: 68px;
    height: 68px;
    transform: rotate(45deg);
    background: linear-gradient(160deg, var(--color-base3), var(--color-base5));
    border: 2px solid var(--color-main2);
    border-radius: var(--radius-card);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.5),
      inset 0 0 10px rgba(255, 228, 178, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    .gem_value {
      transform: rotate(-45deg);
      font-size: var(--font-size-xlarge);
      color: var(--color-main1);
      text-shadow: 0 2px 0 var(--color-base5);
    }
  }
}
</style>
