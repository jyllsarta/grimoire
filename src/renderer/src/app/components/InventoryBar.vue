<template>
  <div class="inventory">
    <div class="slots" :style="{ '--slots': slotCount }">
      <div v-for="i in slotCount" :key="i" class="cell"></div>
      <button
        v-for="e in entities"
        :key="e.uid"
        class="entity"
        :class="[e.kind, { active: e.active, ready: e.ready === true, resting: e.ready === false, concealed }]"
        :style="{ '--pos': e.pos, '--size': sizeOf(e) }"
        @click="onClick(e)"
      >
        <div class="ename">{{ concealed ? "???" : defOf(e).name }}</div>
        <div v-if="!concealed" class="meta hint">
          <span v-if="e.kind === 'equipment'">{{ e.active ? T("inventory.on") : T("inventory.off") }}</span>
          <span v-if="e.kind === 'ability'">{{ e.ready ? T("inventory.use") : `${e.progress}/${defOf(e).rechargeValue ?? "-"}` }}</span>
          <span v-if="e.kind === 'item'">{{ T("inventory.use") }}</span>
          <span v-if="e.durability >= 0">×{{ e.durability }}</span>
        </div>
      </button>
    </div>
    <div v-if="message" class="hint msg">{{ message }}</div>
  </div>
</template>

<script setup>
// インベントリ帯 (02「画面と state の対応」)。クリックで 装備 ON/OFF / アイテム使用 / アビリティ使用 (dispatch)。D&D 整理は M3
import { computed, ref } from "vue";
import { useRunStore } from "../stores/run.js";
import { q } from "@core/queries/index.js";
import { defOf, entitySize } from "@core/domain/entity.js";
import { T, reasonText } from "../text.js";

const run = useRunStore();
const entities = computed(() => run.state.inventory.entities);
const concealed = computed(() => run.state.inventory.concealed);
const slotCount = computed(() => q(run.state).derive("slotCount"));
const message = ref("");

function sizeOf(e) {
  return entitySize(e);
}

function onClick(e) {
  const name = { equipment: "toggleEquip", item: "useItem", ability: "useAbility" }[e.kind];
  const r = run.dispatch(name, { uid: e.uid });
  message.value = r.ok ? "" : reasonText(r.reason);
}
</script>

<style lang="scss" scoped>
.inventory {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .slots {
    --cell: 76px;
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--slots), var(--cell));
    gap: 4px;
    height: 84px;
  }
  .cell {
    height: 84px;
    border-radius: var(--radius-card);
    background: var(--color-base4);
    border: 1px dashed var(--color-base2);
  }
  .entity {
    position: absolute;
    top: 0;
    left: calc(var(--pos) * (var(--cell) + 4px));
    width: calc(var(--size) * var(--cell) + (var(--size) - 1) * 4px);
    height: 84px;
    border-radius: var(--radius-card);
    border: 2px solid var(--color-base1);
    background: var(--color-base3);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2px;
    text-align: center;
    padding: 4px;
    .ename {
      font-size: var(--font-size-small);
      line-height: 1.1;
    }
    &.equipment.active {
      border-color: var(--shape-attack);
      background: var(--color-base2);
    }
    &.ability.ready {
      border-color: var(--color-d1);
    }
    &.ability.resting {
      opacity: 0.6;
    }
    &.item {
      border-color: var(--shape-life);
    }
    &.concealed {
      filter: grayscale(1);
    }
  }
  .msg {
    color: var(--color-negative1);
  }
}
</style>
