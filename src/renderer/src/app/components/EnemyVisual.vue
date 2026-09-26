<template>
  <div class="enemy_visual" :class="anim">
    <div class="enemy_float">
      <div class="enemy_breath"><img class="enemy_icon icon_img" :src="iconPath(def.icon)" alt="" /></div>
    </div>
    <div v-if="enemy.stunned" class="stun_badge">{{ T("battle.stunBadge") }}</div>
  </div>
</template>

<script setup>
// 戦闘中の敵 (tale enemy_visual): 常在アニメ (上下 + 呼吸) は要素を残して、1 回きりの演出 (hit / lunge / small_hop) は class で
import { computed, ref, watch } from "vue";
import { master } from "@core/master/index.js";
import { iconPath } from "../ui/entity_view.js";
import { T } from "../text.js";

const props = defineProps({
  defId: { type: Number, required: true },
  enemy: { type: Object, required: true },
  animAt: { type: Number, default: 0 },
  animKind: { type: String, default: "" },
});
const def = computed(() => master.get("enemies", props.defId));
const anim = ref("");
watch(
  () => props.animAt,
  () => {
    anim.value = "";
    requestAnimationFrame(() => (anim.value = props.animKind));
    setTimeout(() => (anim.value = ""), 500);
  },
);
</script>

<style lang="scss" scoped>
.enemy_visual {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  &::before {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -16px;
    width: 160px;
    height: 34px;
    margin-left: -80px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 45%, rgba(0, 0, 0, 0) 72%);
  }
  .enemy_icon {
    position: relative;
    display: block;
    width: 160px;
    height: 160px;
    margin-bottom: 4px;
  }
  .enemy_float {
    animation: enemy_float 3.9s ease-in-out infinite;
    animation-delay: -0.9s;
  }
  .enemy_breath {
    transform-origin: 50% 100%;
    animation: enemy_breath 2.7s ease-in-out infinite;
    animation-delay: -1.6s;
  }
  &.hit .enemy_icon {
    animation: enemy_hit_anim 0.4s ease;
  }
  &.lunge .enemy_icon {
    animation: enemy_lunge_anim 0.45s ease;
  }
  &.small_hop .enemy_icon {
    animation: heroine_hop 0.5s ease;
  }
  .stun_badge {
    position: absolute;
    top: 2px;
    right: 24%;
    font-size: var(--font-size-small);
    background: var(--color-main2);
    color: var(--color-base5);
    padding: 2px 10px;
    border-radius: var(--radius-round);
  }
}
@keyframes enemy_float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}
@keyframes enemy_breath {
  0%,
  100% {
    transform: scale(0.98);
  }
  50% {
    transform: scale(1.02);
  }
}
@keyframes enemy_hit_anim {
  0% {
    transform: translateX(0);
    filter: none;
  }
  25% {
    transform: translateX(-12px);
    filter: brightness(2.2) saturate(0.4);
  }
  55% {
    transform: translateX(9px);
  }
  100% {
    transform: translateX(0);
    filter: none;
  }
}
@keyframes enemy_lunge_anim {
  0% {
    transform: translate(0, 0);
  }
  35% {
    transform: translate(-56px, 10px) scale(1.12);
  }
  100% {
    transform: translate(0, 0);
  }
}
</style>
