<template>
  <div class="life_panel panel_glass">
    <div class="life_row" data-tips="battle">
      <span class="label">{{ T("ingame.life") }}</span>
      <span class="value">{{ state.player.hp }}</span
      ><span class="hint">/ {{ maxHp }}</span>
    </div>
    <HpDots :hp="state.player.hp" :max="maxHp" />
    <StatusChips class="chip_row" :statuses="state.player.statuses" :unique="state.player.unique" :costume="state.player.costume" size="small" />
    <div class="harsh_row" data-tips="harshness">
      <Shape kind="harshness" :text="null" size="tiny" />
      <span class="label">{{ T("ingame.harshness") }}</span>
      <div class="harsh_bar"><i :style="{ width: `${harshPercent}%` }"></i></div>
      <span class="harsh_num" :class="{ met: harshScore >= threshold }">{{ harshScore }} / {{ threshold }}</span>
    </div>
    <div class="relic_row" data-tips="relic">
      <div v-for="r in state.relics" :key="r.uid" class="relic_icon" :title="relicDef(r).name" :data-desc="`relic:${r.defId}`">
        <img class="icon_img" :src="iconPath(relicDef(r).icon)" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup>
// 左のライフパネル (tale life_panel): ライフ数値 + 点 + ステートチップ + 本の要求メーター + レリック列
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { q } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { iconPath } from "../ui/entity_view.js";
import { T } from "../text.js";
import HpDots from "./HpDots.vue";
import StatusChips from "./StatusChips.vue";
import Shape from "./Shape.vue";

const run = useRunStore();
const state = computed(() => run.state);
const maxHp = computed(() => q(run.state).derive("maxHp"));
const harshScore = computed(() => q(run.state).derive("harshnessScore"));
const threshold = computed(() => master.get("books", run.state.bookId).harshnessThreshold);
const harshPercent = computed(() => Math.min(100, Math.round((harshScore.value / Math.max(1, threshold.value)) * 100)));
const relicDef = (r) => master.get("relics", r.defId);
</script>

<style lang="scss" scoped>
.life_panel {
  padding: 12px 16px 14px;
  .life_row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    .label {
      color: var(--color-white3);
      font-size: var(--font-size-small);
    }
    .value {
      font-size: var(--font-size-xlarge);
      color: var(--color-white0);
      line-height: 1;
    }
  }
  .chip_row {
    margin-top: 6px;
    min-height: 4px;
  }
  .harsh_row {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    .label {
      color: var(--color-white3);
      font-size: var(--font-size-mini);
      white-space: nowrap;
    }
    .harsh_bar {
      flex: 1;
      height: 6px;
      border-radius: var(--radius-round);
      background: var(--color-base5);
      border: 1px solid var(--color-base2);
      overflow: hidden;
      i {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, var(--color-negative3), var(--color-negative1));
        transition: width 0.3s ease;
      }
    }
    .harsh_num {
      font-size: var(--font-size-mini);
      color: var(--color-white2);
      white-space: nowrap;
      &.met {
        color: var(--color-negative1);
      }
    }
  }
  .relic_row {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(5, 38px);
    gap: 6px 8px;
    min-height: 38px;
    .relic_icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-card);
      background: var(--color-base4);
      border: 1px solid var(--color-main4);
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>
