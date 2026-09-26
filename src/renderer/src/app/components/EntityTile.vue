<template>
  <div
    ref="root"
    class="inv_ent"
    :class="[
      `shape_${shape}`,
      kindClass,
      stateClass,
      { active_on: entity.active, ability_ready: entity.kind === 'ability' && entity.ready, selected_ent: selected, dragging },
    ]"
    :style="{ left: `${left}px`, width: `${width}px` }"
    :data-desc="concealed ? null : `${entity.kind}:${entity.defId}`"
    :data-desc-ref="concealed ? null : `uid:${entity.uid}`"
    data-tips="inventory"
  >
    <CardShape :shape="shape" :w="width" :h="height" />
    <div class="card_body">
      <img class="ent_icon icon_img" :src="concealed ? iconPath('himitsu') : entIcon(entity)" alt="" />
      <div class="ent_name">{{ concealed ? "???" : def.name }}</div>
    </div>
    <div v-if="!concealed && countText != null" class="ent_count" :class="{ recharge: entity.kind === 'ability' && !entity.ready }">
      {{ countText }}
    </div>
    <div v-if="!concealed && effects.length" class="ent_fx">
      <Shape v-for="(f, i) in effects" :key="i" :kind="f.shape" :text="f.n" size="tiny" />
    </div>
    <div v-if="entity.active" class="ent_badge">{{ T("inventory.on") }}</div>
  </div>
</template>

<script setup>
// インベントリのタイル (02 inventory)。盤面パネルと同じ形のルール (CardShape)。混乱中 (concealed) は ??? (ON/OFF と幅だけ見える)
import { computed, ref } from "vue";
import { defOf } from "@core/domain/entity.js";
import { q } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { entShapeOf } from "../ui/card_shape.js";
import { iconPath, entIcon, entCountText, entEffects, entStateClass } from "../ui/entity_view.js";
import { T } from "../text.js";
import CardShape from "./CardShape.vue";
import Shape from "./Shape.vue";

const props = defineProps({
  entity: { type: Object, required: true },
  left: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, default: 96 },
  concealed: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  dragging: { type: Boolean, default: false },
});
const run = useRunStore();
const root = ref(null);
const def = computed(() => defOf(props.entity));
const shape = computed(() => entShapeOf(props.entity.kind, def.value));
const kindClass = computed(() => (props.entity.kind === "item" ? "item_kind" : props.entity.kind === "ability" ? "ability_kind" : ""));
const stateClass = computed(() => (run.state ? entStateClass(props.entity, q(run.state)) : ""));
const countText = computed(() => entCountText(props.entity.kind, def.value, props.entity));
const effects = computed(() => entEffects(props.entity.kind, def.value, props.entity));
defineExpose({ root });
</script>

<style lang="scss" scoped>
.inv_ent {
  position: absolute;
  top: 0;
  bottom: 0;
  --card-bg1: var(--color-base1);
  --card-bg2: var(--color-base3);
  --card-stroke: var(--color-base1);
  --kind-color: var(--color-main3);
  --card-shadow: drop-shadow(3px 5px 2px #000);
  --card-stroke-width: 2;
  --slab-offset: 3px;
  cursor: pointer;
  z-index: 2;
  transition:
    filter 0.1s ease,
    transform 0.1s ease;
  &:hover {
    filter: brightness(1.12);
  }
  &.item_kind {
    --kind-color: var(--color-positive2);
    --card-stroke: var(--color-positive2);
    --card-bg1: #4d6892;
    --card-bg2: #2b3a55;
  }
  &.ability_kind {
    --kind-color: var(--color-accent4);
    --card-stroke: var(--color-accent4);
    --card-bg1: #3b7247;
    --card-bg2: #25402b;
  }
  &.ability_ready {
    --card-shadow: drop-shadow(3px 5px 2px #000) drop-shadow(0 0 7px rgba(138, 255, 159, 0.45));
  }
  &.active_on {
    --card-stroke: var(--color-main1);
    --card-bg1: #8a6a44;
    --card-shadow: drop-shadow(3px 5px 2px #000) drop-shadow(0 0 8px rgba(255, 228, 178, 0.55));
    transform: translateY(-3px);
  }
  &.inactive {
    filter: brightness(0.8) saturate(0.7);
    opacity: 0.85;
    &:hover {
      filter: brightness(1) saturate(0.9);
      opacity: 1;
    }
  }
  &.disabled {
    filter: brightness(0.5) grayscale(0.7);
    opacity: 0.55;
    &:hover {
      filter: brightness(0.65) grayscale(0.6);
      opacity: 0.7;
    }
  }
  &.selected_ent {
    --card-stroke: var(--color-accent2);
    --card-stroke-width: 3;
  }
  &.dragging {
    z-index: 30;
    transition: none;
    --card-stroke: var(--color-accent2);
    filter: brightness(1.1) drop-shadow(0 10px 8px rgba(0, 0, 0, 0.6));
  }

  .card_body {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  &.shape_weapon .card_body {
    padding-top: 12px;
  }
  &.shape_armor .card_body {
    padding-bottom: 10px;
  }
  &.shape_item .card_body {
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .ent_icon {
    width: 40px;
    height: 40px;
  }
  .ent_name {
    font-size: var(--font-size-mini);
    color: var(--color-white0);
    max-width: 100%;
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 14px;
  }
  .ent_count {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--kind-color);
    box-shadow:
      0 0 8px color-mix(in srgb, var(--kind-color) 55%, transparent) inset,
      0 0 4px color-mix(in srgb, var(--kind-color) 45%, transparent);
    border-radius: 0 var(--radius-card) 0 var(--radius-card);
    background: rgba(0, 0, 0, 0.55);
    font-size: var(--font-size-small);
    color: var(--color-white0);
    z-index: 2;
    &.recharge {
      --kind-color: var(--color-negative1);
      color: var(--color-negative0);
    }
  }
  &.shape_weapon .ent_count,
  &.shape_item .ent_count {
    top: 8px;
    right: -3px;
  }
  .ent_fx {
    position: absolute;
    right: 2px;
    bottom: 2px;
    display: flex;
    gap: 2px;
    z-index: 2;
  }
  &.shape_armor .ent_fx {
    bottom: 12px;
    right: 5px;
  }
  &.shape_item .ent_fx {
    bottom: 9px;
    right: 6px;
  }
  .ent_badge {
    position: absolute;
    top: -7px;
    left: -7px;
    font-size: var(--font-size-mini);
    background: var(--color-main2);
    color: var(--color-base5);
    padding: 0 6px;
    border-radius: var(--radius-round);
    border: 1px solid var(--color-base4);
  }
}
</style>
