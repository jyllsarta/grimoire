<template>
  <div class="sd_piece" :class="{ hop }" :style="{ width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s` }">
    <div class="float_body" :style="{ animationDuration: `${floatDuration}s`, animationDelay: `${floatDelay}s` }">
      <img v-for="src in layers" :key="src" :src="src" :class="{ sd_outline: isOutline(src) }" :style="isOutline(src) ? outlineStyle : null" alt="" />
      <img v-for="src in overlays" :key="src" class="sd_status" :src="src" alt="" />
    </div>
  </div>
</template>

<script setup>
// SD の駒 (04 / 09): 白フチ / 羽 / ベース / 衣装 or 固有バステ / 表情 / 共通バステの重ね。
// 白フチは tools/sd_outline.py が生成する outline_<layer>.png (素材より四方 SD_OUTLINE_PAD ずつ広いので、その分はみ出して重ねる)。
// 表情は talk ストアの faceId (毒中は常にげっそり)
import { computed, ref, watch } from "vue";
import { master } from "@core/master/index.js";
import { useTalkStore } from "../stores/talk.js";
import { sdLayers, SD_OUTLINE_PAD } from "../ui/sd.js";

const props = defineProps({
  characterId: { type: Number, required: true },
  player: { type: Object, default: null },
  size: { type: Number, default: 400 },
  floatDuration: { type: Number, default: 3.3 },
  floatDelay: { type: Number, default: -1.4 },
});
const talk = useTalkStore();
const layers = computed(() => sdLayers(props.characterId, props.player, talk.faceId));
const isOutline = (src) => /\/outline_[^/]+\.png$/.test(src);
const outlineStyle = computed(() => {
  const pad = props.size * SD_OUTLINE_PAD;
  return { left: `${-pad}px`, top: `${-pad}px`, width: `${props.size + pad * 2}px` };
});
const overlays = computed(() => {
  const list = (props.player?.statuses ?? []).map((s) => master.byKey("statuses", s.key)).filter((d) => d.sdLayer);
  list.sort((a, b) => a.order - b.order);
  return list.map((d) => `assets/characters/${props.characterId}/sd/${d.sdLayer}.png`);
});
const hop = ref(false);
const delay = 0;
watch(
  () => talk.hopAt,
  () => {
    hop.value = false;
    requestAnimationFrame(() => (hop.value = true));
    setTimeout(() => (hop.value = false), 600);
  },
);
</script>

<style lang="scss" scoped>
.sd_piece {
  position: relative;
  pointer-events: none;
  filter: drop-shadow(6px 10px 3px #000);
  &.hop {
    animation: heroine_hop 0.55s ease;
  }
  .float_body {
    position: absolute;
    inset: 0;
    animation: float_body 3.3s ease-in-out infinite;
  }
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}
</style>
