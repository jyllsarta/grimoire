<template>
  <div ref="root" class="toast" :class="fragment.params.tone">{{ fragment.params.message }}</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";

const props = defineProps({ fragment: Object });
const emit = defineEmits(["remove"]);
const root = ref(null);
let timer = null;

onMounted(() => {
  // 同時に出たトーストは id 順に少しずつ下へずらす
  const offset = (props.fragment.id % 4) * 44;
  gsap.fromTo(root.value, { y: 20 + offset, opacity: 0 }, { y: offset, opacity: 1, duration: 0.2 });
  gsap.to(root.value, { opacity: 0, duration: 0.3, delay: 1.2 });
  timer = window.setTimeout(() => emit("remove", props.fragment.id), 1600);
});
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  gsap.killTweensOf(root.value);
});
</script>

<style lang="scss" scoped>
.toast {
  position: absolute;
  left: 50%;
  top: 120px;
  transform: translateX(-50%);
  padding: 6px 18px;
  border-radius: var(--radius-round);
  background: rgba(31, 27, 25, 0.9);
  border: 1px solid var(--color-base1);
  font-size: var(--font-size-normal);
  white-space: nowrap;
  &.good {
    color: var(--color-accent2);
  }
  &.bad {
    color: var(--color-negative1);
  }
}
</style>
