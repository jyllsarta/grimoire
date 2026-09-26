<template>
  <div ref="root" class="cutin">
    <img :src="src" alt="" @error="onError" />
  </div>
</template>

<script setup>
// 不利イベントのカットイン (07 / 09): 画面中央に軽くデフォルメ絵を出す。全画面は覆わない。素材は grimoire_scenes/cutin<eventId>.png
import { onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";

const props = defineProps({ fragment: Object });
const emit = defineEmits(["remove"]);
const root = ref(null);
const src = `grimoire_scenes/${props.fragment.params.cutin}.png`;
let timer = null;

onMounted(() => {
  gsap.fromTo(root.value, { scale: 0.6, opacity: 0, rotate: -6 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.3, ease: "back.out(1.6)" });
  gsap.to(root.value, { opacity: 0, scale: 0.9, duration: 0.3, delay: 1.6 });
  timer = window.setTimeout(() => emit("remove", props.fragment.id), 2000);
});
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  gsap.killTweensOf(root.value);
});
function onError() {
  // 素材が無い (秘匿シーンのリンク切れ) ときは何も出さない。素材を置けば映る
  emit("remove", props.fragment.id);
}
</script>

<style lang="scss" scoped>
.cutin {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 480px;
  height: 480px;
  margin-left: -240px;
  margin-top: -240px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.7));
  img {
    max-width: 100%;
    max-height: 100%;
  }
}
</style>
