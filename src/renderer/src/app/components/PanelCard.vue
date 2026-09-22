<template>
  <button class="card" :class="[panel.kind, { selectable, selected, boss: panel.isBoss }]" :disabled="!selectable" @click="$emit('select')">
    <div class="kind hint">{{ kindLabel }}</div>
    <img v-if="icon" class="icon pixel_icon" :src="`assets/icons/${icon}.gif`" alt="" />
    <div class="name">{{ name }}</div>
    <div v-if="panel.kind === 'enemy'" class="stats hint">
      ♥ {{ panel.enemy.hp }}<span v-if="panel.enemy.block"> / ■ {{ panel.enemy.block }}</span>
      <div class="routine">{{ routineText }}</div>
    </div>
    <StatusChips v-if="panel.kind === 'enemy' && panel.enemy.statuses.length" :statuses="panel.enemy.statuses" />
  </button>
</template>

<script setup>
// 盤面の 1 マス (02 board)。中身は state.board.panels[uid] をそのまま描く
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { currentRoutine } from "@core/queries/index.js";
import { T } from "../text.js";
import StatusChips from "./StatusChips.vue";

const props = defineProps({
  panel: { type: Object, required: true },
  selectable: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
});
defineEmits(["select"]);

const def = computed(() => (props.panel.kind === "chapterClear" ? null : defOf(props.panel)));
const name = computed(() => (def.value ? def.value.name : T("panel.chapterClear")));
const icon = computed(() => def.value?.icon ?? null);
const kindLabel = computed(
  () =>
    ({
      enemy: props.panel.isBoss ? "ぬし" : "モンスター",
      equipment: "そうび",
      item: "アイテム",
      ability: "アビリティ",
      event: "イベント",
      chapterClear: "",
    })[props.panel.kind],
);
const routineText = computed(() => {
  if (props.panel.kind !== "enemy") return "";
  const r = currentRoutine(props.panel);
  if (!r) return "";
  return r.actions.map((a) => `${a.type}${a.value ? ` ${a.value}` : ""}`).join(" / ");
});
</script>

<style lang="scss" scoped>
.card {
  width: 150px;
  height: 150px;
  border-radius: var(--radius-panel);
  border: 2px solid var(--color-base1);
  background: linear-gradient(160deg, var(--color-base3), var(--color-base5));
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  text-align: center;
  cursor: default;
  &.selectable {
    cursor: pointer;
    &:hover {
      filter: brightness(1.12);
    }
  }
  &.selected {
    border-color: var(--color-main1);
    transform: translateY(-6px);
  }
  &.enemy {
    border-color: var(--shape-harm);
  }
  &.boss {
    border-color: var(--color-d1);
    background: linear-gradient(160deg, var(--color-negative4), var(--color-base5));
  }
  &.equipment {
    border-color: var(--shape-attack);
  }
  &.item {
    border-color: var(--shape-life);
  }
  &.ability {
    border-color: var(--color-d1);
  }
  &.event {
    border-color: var(--color-positive1);
  }
  &.chapterClear {
    border-color: var(--color-main1);
    background: linear-gradient(160deg, var(--color-main4), var(--color-base4));
  }
  .icon {
    width: calc(24px * 2);
    height: calc(24px * 2);
  }
  .name {
    font-size: var(--font-size-small);
    line-height: 1.1;
  }
  .routine {
    font-size: var(--font-size-mini);
  }
}
</style>
