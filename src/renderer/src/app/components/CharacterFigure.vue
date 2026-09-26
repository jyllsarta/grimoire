<template>
  <div class="figure" :class="{ hop, static: isStatic }">
    <div class="float_wing"><img :src="`assets/characters/${characterId}/stand/wing.png`" alt="" /></div>
    <div class="float_body">
      <img :src="`assets/characters/${characterId}/stand/base.png`" alt="" />
      <img :src="`assets/characters/${characterId}/stand/face/${face}.png`" alt="" />
    </div>
  </div>
</template>

<script setup>
// 立ち絵 (09): wing → base → face を重ね、羽と体が別周期でふわふわ (xqueens TouchableCharacter 準拠)。
// faceId を渡さなければ talk ストアの表情に追従する (インゲームの常駐立ち絵)。オラクルちゃんも同じ部品
import { computed, ref, watch } from "vue";
import { useTalkStore } from "../stores/talk.js";

const props = defineProps({
  characterId: { type: Number, required: true },
  faceId: { type: Number, default: null },
  isStatic: { type: Boolean, default: false },
  followTalk: { type: Boolean, default: false },
});
const talk = useTalkStore();
const face = computed(() => (props.followTalk ? talk.faceId : (props.faceId ?? 1)));
const hop = ref(false);
watch(
  () => talk.hopAt,
  () => {
    if (!props.followTalk) return;
    hop.value = false;
    requestAnimationFrame(() => (hop.value = true));
    setTimeout(() => (hop.value = false), 600);
  },
);
</script>

<style lang="scss" scoped>
.figure {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  &.hop {
    animation: heroine_hop 0.55s ease;
  }
  .float_wing,
  .float_body {
    position: absolute;
    inset: 0;
  }
  .float_wing {
    animation: float_wing 4.5s ease-in-out infinite alternate;
  }
  .float_body {
    animation: float_body 4.1s ease-in-out infinite;
  }
  &.static .float_wing,
  &.static .float_body {
    animation: none;
  }
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
  }
}
</style>
