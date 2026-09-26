<template>
  <div
    class="panel_card"
    :class="[`shape_${shape}`, typeClass, { boss: panel.isBoss, selectable, falling: anim === 'fall', spawning: anim === 'spawn' }]"
    :data-desc="desc"
    :data-desc-ref="descRef"
    :data-tips="tips"
    @click="selectable && $emit('select')"
  >
    <CardShape :shape="shape" :w="165" :h="165" />
    <div class="card_body">
      <img class="face_icon icon_img" :src="icon" alt="" />
      <div class="panel_name">{{ name }}</div>
      <div v-if="sub" class="panel_sub">{{ sub }}</div>
    </div>
    <div v-if="hpChip" class="hp_chip">{{ hpChip }}</div>
    <div v-if="enemyChips.length" class="enemy_chips">
      <Shape v-for="c in enemyChips" :key="c.key" :kind="c.shape" :text="c.text" size="tiny" :title="c.title" />
    </div>
    <div v-if="costChip != null" class="cost_gem">
      <span>{{ costChip }}</span>
    </div>
    <div v-if="countText != null" class="ent_count">{{ countText }}</div>
    <div v-if="effects.length" class="ent_fx">
      <Shape v-for="(f, i) in effects" :key="i" :kind="f.shape" :text="f.n" size="tiny" />
    </div>
  </div>
</template>

<script setup>
// 盤面の 1 枚 (02 board)。中身は state.board.panels[uid] をそのまま描く (tale の cardHtml / panelInfo)
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { q } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { panelShapeOf } from "../ui/card_shape.js";
import { STATUS_SHAPE } from "../ui/shapes.js";
import { iconPath, kindLabel, entCountText, entEffects } from "../ui/entity_view.js";
import { T } from "../text.js";
import CardShape from "./CardShape.vue";
import Shape from "./Shape.vue";

const props = defineProps({
  panel: { type: Object, required: true },
  cell: { type: Number, default: -1 },
  selectable: { type: Boolean, default: false },
  anim: { type: String, default: "" },
  tips: { type: String, default: "panel" },
});
defineEmits(["select"]);

const run = useRunStore();
const def = computed(() => (props.panel.kind === "chapterClear" ? null : defOf(props.panel)));
const shape = computed(() => panelShapeOf(props.panel, def.value));
const typeClass = computed(() => {
  switch (props.panel.kind) {
    case "enemy":
      return "type_enemy";
    case "event":
      return "type_event";
    case "chapterClear":
      return "type_chapterClear";
    default:
      return `type_treasure kind_${props.panel.kind}`;
  }
});
const icon = computed(() => iconPath(def.value ? def.value.icon : "complete"));
const name = computed(() => (def.value ? def.value.name : T("panel.chapterClearName")));
const hurt = computed(() => props.panel.kind === "enemy" && props.panel.enemy.hp < q(run.state).derive("enemyMaxHp", { defId: props.panel.defId }));
const sub = computed(() => {
  switch (props.panel.kind) {
    case "enemy":
      return hurt.value ? "" : props.panel.isBoss ? T("panel.bossSub") : T("panel.monsterSub");
    case "event":
      return master.get("events", props.panel.defId).kind === "misfortune" ? T("panel.misfortuneSub") : T("panel.eventSub");
    case "chapterClear":
      return T("panel.chapterClearSub");
    default:
      return kindLabel(props.panel.kind);
  }
});
const hpChip = computed(() => (hurt.value ? `${props.panel.enemy.hp}/${q(run.state).derive("enemyMaxHp", { defId: props.panel.defId })}` : null));
const enemyChips = computed(() => {
  if (props.panel.kind !== "enemy") return [];
  const e = props.panel.enemy;
  const out = [];
  if (e.shield > 0) out.push({ key: "shield", shape: "enemyShield", text: e.shield, title: `${T("battle.enemyShield")} ${e.shield}` });
  for (const s of e.statuses)
    out.push({ key: s.key, shape: STATUS_SHAPE[s.key] || "status", text: s.value, title: master.byKey("statuses", s.key).name });
  return out;
});
const costChip = computed(() =>
  ["equipment", "item", "ability"].includes(props.panel.kind) ? q(run.state).derive("panelCost", { def: def.value, panel: props.panel }) : null,
);
const countText = computed(() =>
  ["equipment", "item", "ability"].includes(props.panel.kind) ? entCountText(props.panel.kind, def.value, null) : null,
);
const effects = computed(() => (["equipment", "item", "ability"].includes(props.panel.kind) ? entEffects(props.panel.kind, def.value, null) : []));
const desc = computed(() => (props.panel.kind === "chapterClear" ? null : `${props.panel.kind}:${props.panel.defId}`));
const descRef = computed(() => (props.panel.kind === "enemy" && props.cell >= 0 ? `cell:${props.cell}` : null));
</script>

<style lang="scss" scoped>
.panel_card {
  position: absolute;
  inset: 0;
  --card-bg1: var(--color-base2);
  --card-bg2: var(--color-base4);
  --card-stroke: var(--color-base1);
  --kind-color: var(--color-main3);
  transition:
    transform 0.12s ease,
    filter 0.12s ease;
  &.type_enemy {
    --card-stroke: var(--color-negative2);
  }
  &.type_treasure {
    --card-stroke: var(--color-main3);
  }
  &.kind_item {
    --kind-color: var(--color-positive2);
    --card-stroke: var(--color-positive2);
    --card-bg1: #4d6892;
    --card-bg2: #2b3a55;
  }
  &.kind_ability {
    --kind-color: var(--color-accent4);
    --card-stroke: var(--color-accent4);
    --card-bg1: #3b7247;
    --card-bg2: #25402b;
  }
  &.type_event {
    --card-stroke: var(--color-positive2);
  }
  &.type_chapterClear {
    --card-stroke: var(--color-accent3);
    --card-bg1: #2c4430;
  }
  &.boss {
    --card-stroke: var(--color-negative1);
    --card-shadow: drop-shadow(4px 6px 2px #000) drop-shadow(0 0 12px rgba(221, 92, 120, 0.6));
  }
  &.selectable {
    cursor: pointer;
    &:hover {
      transform: translateY(-5px) scale(1.03);
      filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.55));
      --card-stroke: var(--color-main1);
      --card-stroke-width: 4;
    }
  }
  &.falling {
    animation: panel_fall_anim 0.34s cubic-bezier(0.4, 0, 0.6, 1.2) both;
  }
  &.spawning {
    animation: panel_spawn_anim 0.34s ease both;
  }

  .card_body {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  &.shape_armor .card_body {
    padding-bottom: 24px;
  }
  &.shape_weapon .card_body {
    padding-top: 28px;
  }
  &.shape_item .card_body {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  &.shape_event .card_body,
  &.shape_clear .card_body {
    padding-top: 10px;
  }
  &.shape_ability .card_body {
    padding-bottom: 4px;
  }
  &.type_treasure .card_body {
    padding-bottom: 16px;
  }
  &.shape_armor.type_treasure .card_body {
    padding-bottom: 26px;
  }
  .face_icon {
    width: 64px;
    height: 64px;
  }
  .panel_name {
    font-size: var(--font-size-small);
    color: var(--color-white0);
    max-width: 140px;
    text-align: center;
    line-height: 1.2;
  }
  .panel_sub {
    font-size: var(--font-size-mini);
    color: var(--color-white3);
  }
  .hp_chip {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: var(--font-size-mini);
    padding: 1px 7px;
    background: var(--color-negative4);
    color: var(--color-negative0);
    border-radius: var(--radius-round);
  }
  .enemy_chips {
    position: absolute;
    top: 30px;
    right: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 2;
  }
  .cost_gem {
    position: absolute;
    left: -9px;
    top: -9px;
    width: 36px;
    height: 36px;
    transform: rotate(45deg);
    background: linear-gradient(160deg, var(--color-base3), var(--color-base5));
    border: 2px solid var(--color-main2);
    border-radius: 4px;
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.5),
      inset 0 0 6px rgba(255, 228, 178, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    span {
      transform: rotate(-45deg);
      font-size: var(--font-size-normal);
      color: var(--color-main1);
      text-shadow: 0 1px 0 var(--color-base5);
    }
  }
  &.shape_weapon .cost_gem,
  &.shape_item .cost_gem {
    top: 24px;
    left: -12px;
  }
  .ent_count {
    position: absolute;
    top: -1px;
    right: -1px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--kind-color);
    box-shadow:
      0 0 8px color-mix(in srgb, var(--kind-color) 55%, transparent) inset,
      0 0 4px color-mix(in srgb, var(--kind-color) 45%, transparent);
    border-radius: 0 var(--radius-card) 0 var(--radius-card);
    background: rgba(0, 0, 0, 0.55);
    font-size: var(--font-size-normal);
    color: var(--color-white0);
    z-index: 2;
  }
  &.shape_weapon .ent_count,
  &.shape_item .ent_count {
    top: 26px;
    right: -4px;
  }
  .ent_fx {
    position: absolute;
    right: 4px;
    bottom: 4px;
    display: flex;
    gap: 2px;
    z-index: 2;
    :deep(.shape.tiny) {
      width: 28px;
      height: 28px;
      font-size: var(--font-size-small);
    }
  }
  &.shape_armor .ent_fx {
    bottom: 32px;
    right: 8px;
  }
  &.shape_item .ent_fx {
    bottom: 30px;
    right: 10px;
  }
}
@keyframes panel_fall_anim {
  from {
    transform: translateY(-179px);
  }
  to {
    transform: none;
  }
}
@keyframes panel_spawn_anim {
  from {
    transform: translateY(-60px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
</style>
