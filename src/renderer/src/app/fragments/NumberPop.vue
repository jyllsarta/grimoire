<template>
  <div ref="root" class="pop" :class="[fragment.params.kind, fragment.params.side]">
    {{ label }}
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";

const props = defineProps({ fragment: Object });
const emit = defineEmits(["remove"]);
const root = ref(null);
let timer = null;

const label = computed(() => {
  const p = props.fragment.params;
  if (p.kind === "blocked") return "ブロック!";
  if (p.kind === "heal") return `+${p.value}`;
  return `-${p.value}`;
});

onMounted(() => {
  gsap.fromTo(root.value, { y: 0, opacity: 1, scale: 0.6 }, { y: -40, scale: 1.2, duration: 0.5, ease: "power2.out" });
  gsap.to(root.value, { opacity: 0, duration: 0.25, delay: 0.5 });
  timer = window.setTimeout(() => emit("remove", props.fragment.id), 800);
});
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  gsap.killTweensOf(root.value);
});
</script>

<style lang="scss" scoped>
// 位置は暫定 (バトルパネルの左右)。M3 でレイアウトに合わせる
.pop {
  position: absolute;
  top: 300px;
  font-size: var(--font-size-2xlarge);
  font-weight: bold;
  text-shadow: 2px 2px 0 #000;
  &.player {
    left: 720px;
  }
  &.enemy {
    left: 920px;
  }
  &.damage {
    color: var(--color-negative1);
  }
  &.poison {
    color: var(--color-d1);
  }
  &.heal {
    color: var(--color-accent2);
  }
  &.blocked {
    color: var(--color-positive1);
    font-size: var(--font-size-large);
  }
}
</style>
