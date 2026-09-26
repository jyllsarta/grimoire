<template>
  <div v-if="shape === 'ability'" class="card_slab" :style="clip"></div>
  <div class="card_bg" :style="clip"></div>
  <svg class="card_frame" :viewBox="`0 0 ${w} ${h}`" aria-hidden="true"><path :d="path" /></svg>
</template>

<script setup>
// 形の層 (石板の厚み / 塗り / 縁取り)。盤面パネル (PanelCard) とインベントリのタイル (EntityTile) 共通。
// 色は親の CSS 変数 (--card-bg1 / --card-bg2 / --card-stroke) で決める
import { computed } from "vue";
import { shapePath } from "../ui/card_shape.js";

const props = defineProps({
  shape: { type: String, required: true },
  w: { type: Number, required: true },
  h: { type: Number, required: true },
});
const path = computed(() => shapePath(props.shape, props.w, props.h));
const clip = computed(() => ({ clipPath: `path('${path.value}')` }));
</script>

<style lang="scss" scoped>
.card_bg,
.card_slab {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, var(--card-bg1), var(--card-bg2));
}
.card_slab {
  background: var(--color-base5);
  transform: translate(var(--slab-offset, 5px), var(--slab-offset, 5px));
  opacity: 0.85;
}
.card_bg {
  filter: var(--card-shadow, drop-shadow(4px 6px 2px #000));
}
.card_frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: var(--card-stroke);
  stroke-width: var(--card-stroke-width, 3);
  stroke-linejoin: round;
  pointer-events: none;
  transition: stroke 0.12s ease;
}
</style>
