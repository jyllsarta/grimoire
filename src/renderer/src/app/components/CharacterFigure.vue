<template>
  <div class="figure">
    <img class="layer" :src="`assets/characters/${characterId}/stand/wing.png`" alt="" />
    <img class="layer" :src="`assets/characters/${characterId}/stand/base.png`" alt="" />
    <img class="layer" :src="`assets/characters/${characterId}/stand/face/${faceId}.png`" alt="" />
  </div>
</template>

<script setup>
// 立ち絵 (09): wing → base → face を重ねるだけ。オラクルちゃんも同じ部品
defineProps({
  characterId: { type: Number, required: true },
  faceId: { type: Number, default: 1 },
});
</script>

<style lang="scss" scoped>
.figure {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  .layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: auto;
  }
}
</style>
