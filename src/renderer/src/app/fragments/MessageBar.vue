<template>
  <div ref="root" class="fragment" :class="fragment.params.tone">
    <div ref="top" class="top_line"></div>
    <div class="message">{{ fragment.params.message }}</div>
    <div ref="bottom" class="bottom_line"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";

const props = defineProps({ fragment: Object });
const emit = defineEmits(["remove"]);
const root = ref(null);
const top = ref(null);
const bottom = ref(null);
let timer = null;

onMounted(() => {
  const duration = (props.fragment.params.duration ?? 500) / 1000;
  gsap.to(top.value, { duration, width: "100%" });
  gsap.to(bottom.value, { duration, width: "100%" });
  gsap.to(root.value, { duration, opacity: 0, delay: duration * 1.5 });
  timer = window.setTimeout(() => emit("remove", props.fragment.id), duration * 2.5 * 1000);
});
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  gsap.killTweensOf([top.value, bottom.value, root.value]);
});
</script>

<style lang="scss" scoped>
.fragment {
  position: absolute;
  width: 60%;
  height: 72px;
  left: 20%;
  top: 44%;
  pointer-events: none;
  background-color: rgba(9, 8, 24, 0.72);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .top_line,
  .bottom_line {
    position: absolute;
    height: 2px;
    width: 0%;
    background-color: var(--color-white0);
  }
  .top_line {
    top: 0;
    left: 0;
  }
  .bottom_line {
    bottom: 0;
    right: 0;
  }
  .message {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: var(--font-size-large);
    line-height: 1.3;
  }
  &.good .message {
    color: var(--color-accent2);
  }
  &.bad .message {
    color: var(--color-negative1);
  }
}
</style>
