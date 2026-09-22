<template>
  <div class="frame">
    <transition name="show">
      <div v-if="visible" class="baloon">
        <div class="baloon_frame" :class="{ mirrored: mirrorFrame }">
          <div class="letters">
            <span v-for="(t, index) in message" :key="t + index + updatedAt" class="letter" :style="{ animationDelay: index * 6 + 'ms' }">{{
              t
            }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
// 吹き出し (xqueens Baloon.vue。tale で移植済みの数値: slice 60 / width 54 / outset 8)
import { ref, watch } from "vue";

const props = defineProps({
  message: { type: String, default: "" },
  updatedAt: { type: Number, default: 0 },
  mirrorFrame: { type: Boolean, default: false },
});
const visible = ref(!!props.message);
watch(
  () => [props.message, props.updatedAt],
  () => {
    visible.value = !!props.message;
  },
);
</script>

<style lang="scss" scoped>
.frame {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
}
.baloon {
  width: 100%;
  display: flex;
  align-items: stretch;
}
.baloon_frame {
  border-image-source: url("/assets/frames/baloon.png");
  border-image-slice: 60 60 60 60 fill;
  border-image-width: 54px;
  border-image-outset: 8px;
  border-image-repeat: repeat;
  width: 100%;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  border-radius: 12px;
  line-height: 130%;
  color: var(--color-base5);

  // 反転は transform ではなく左右反転済みの画像に差し替える (border-image の継ぎ目対策)
  &.mirrored {
    border-image-source: url("/assets/frames/baloon_mirror.png");
  }
  .letter {
    animation: vertical-text-in 0.2s cubic-bezier(0.22, 0.15, 0.25, 1.43) 0s backwards;
  }
  @keyframes vertical-text-in {
    0% {
      transform: translate(0, -2px);
      opacity: 0;
    }
  }
}
.show-enter-active {
  animation: showanim 0.15s;
}
.show-leave-active {
  animation: showanim 0.15s reverse;
}
@keyframes showanim {
  0% {
    opacity: 0;
    transform: scale(0) translateY(-80px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
