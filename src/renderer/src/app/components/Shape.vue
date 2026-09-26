<template>
  <span class="shape" :class="[kind, size, { light: lightText }]" :title="title || undefined">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <svg viewBox="0 0 48 48" aria-hidden="true" v-html="svg"></svg>
    <b v-if="text != null">{{ text }}</b>
  </span>
</template>

<script setup>
// 図形 1 個 (app/ui/shapes.js)。size: "" (52px) / small (34px) / tiny (22px)。text が null なら記号だけ
import { computed } from "vue";
import { SHAPE_SVG, SHAPE_LIGHT_TEXT } from "../ui/shapes.js";

const props = defineProps({
  kind: { type: String, required: true },
  text: { type: [String, Number], default: null },
  size: { type: String, default: "" },
  title: { type: String, default: "" },
});
const svg = computed(() => SHAPE_SVG[props.kind] || SHAPE_SVG.rest);
const lightText = computed(() => SHAPE_LIGHT_TEXT.has(props.kind));
</script>

<style lang="scss" scoped>
.shape {
  position: relative;
  width: 52px;
  height: 52px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-medium);
  color: var(--color-base5);
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.45));
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  b {
    position: relative;
    font-weight: normal;
    line-height: 1;
  }
  &.light b {
    color: var(--color-white0);
    text-shadow:
      0 0 3px var(--color-base5),
      0 0 2px var(--color-base5);
  }
  &.small {
    width: 34px;
    height: 34px;
    font-size: var(--font-size-small);
  }
  &.tiny {
    width: 22px;
    height: 22px;
    font-size: var(--font-size-mini);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
}
</style>
