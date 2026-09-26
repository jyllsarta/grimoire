<template>
  <!-- 見出し: ✧ ―〈 title 〉― ✧ (既定) / event: ··· ― ◇ title ◇ ― ··· -->
  <div v-if="kind === 'head'" class="orn_head" :class="[variant]">
    <OrnEnd :event="variant === 'event'" />
    <i class="orn_line"></i>
    <span class="orn_title">
      <template v-if="variant === 'event'"
        ><i class="orn_dia"></i
        ><span
          ><slot>{{ title }}</slot></span
        ><i class="orn_dia"></i
      ></template>
      <template v-else>
        <svg class="orn_br" viewBox="0 0 12 28" aria-hidden="true"><path d="M10 1.5 L2 14 L10 26.5" /></svg>
        <span
          ><slot>{{ title }}</slot></span
        >
        <svg class="orn_br" viewBox="0 0 12 28" aria-hidden="true"><path d="M2 1.5 L10 14 L2 26.5" /></svg>
      </template>
    </span>
    <i class="orn_line"></i>
    <OrnEnd :event="variant === 'event'" />
  </div>
  <!-- 足元: ―― ✧ ―― (event は両端に ···) -->
  <div v-else-if="kind === 'foot'" class="orn_foot">
    <OrnDots v-if="variant === 'event'" />
    <i class="orn_line"></i>
    <OrnSpark />
    <i class="orn_line"></i>
    <OrnDots v-if="variant === 'event'" />
  </div>
  <!-- 汎用の下線: ◇ ―――― ◇ -->
  <div v-else class="orn_rule"><i class="orn_dia"></i><i class="orn_line"></i><i class="orn_dia"></i></div>
</template>

<script setup>
// ダイアログの飾り (tale の ornHead / ornFoot / ornRule)。フォントに無い記号は SVG / CSS で描く
import { h } from "vue";

defineProps({
  kind: { type: String, default: "rule" }, // head / foot / rule
  title: { type: String, default: "" },
  variant: { type: String, default: "" }, // "" / event / big / page / bad
});

const OrnSpark = () =>
  h("svg", { class: "orn_spark", viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", { d: "M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" }),
  ]);
const OrnDots = () =>
  h("svg", { class: "orn_dots", viewBox: "0 0 30 6", "aria-hidden": "true" }, [
    h("circle", { cx: 3, cy: 3, r: 2.2 }),
    h("circle", { cx: 15, cy: 3, r: 2.2 }),
    h("circle", { cx: 27, cy: 3, r: 2.2 }),
  ]);
const OrnEnd = (props) => (props.event ? OrnDots() : OrnSpark());
</script>

<style lang="scss">
// 飾りは他コンポーネントからも部品 (.orn_spark 等) を使うので非 scoped
.orn_head,
.orn_foot,
.orn_rule {
  display: flex;
  align-items: center;
  gap: 10px;
}
.orn_line {
  flex: 1;
  min-width: 20px;
  height: 1px;
  background: var(--color-main3);
  opacity: 0.7;
}
.orn_spark {
  width: 18px;
  height: 18px;
  flex: none;
  fill: var(--color-main2);
  filter: drop-shadow(0 0 4px rgba(238, 200, 129, 0.55));
}
.orn_br {
  width: 10px;
  height: 26px;
  flex: none;
  fill: none;
  stroke: var(--color-main2);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.orn_dia {
  width: 7px;
  height: 7px;
  flex: none;
  background: var(--color-main2);
  transform: rotate(45deg);
  display: inline-block;
}
.orn_dots {
  width: 26px;
  height: 6px;
  flex: none;
  fill: var(--color-main3);
  opacity: 0.8;
}
.orn_head .orn_title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-main1);
  font-size: var(--font-size-medium);
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.orn_head.big .orn_title {
  font-size: var(--font-size-2xlarge);
  text-shadow: 0 4px 0 var(--color-base5);
}
.orn_head.big .orn_spark {
  width: 26px;
  height: 26px;
}
.orn_head.page .orn_title {
  font-size: var(--font-size-xlarge);
  text-shadow: 0 3px 0 var(--color-base5);
}
.orn_head.page .orn_spark {
  width: 22px;
  height: 22px;
}
.orn_head.event .orn_title {
  font-size: var(--font-size-small);
  letter-spacing: 0.2em;
  color: var(--color-main2);
}
.orn_head.bad .orn_title {
  color: var(--color-negative1);
}
.orn_head.bad .orn_spark {
  fill: var(--color-negative1);
  filter: none;
}
.orn_foot {
  margin-top: 18px;
}
.orn_rule {
  margin-top: 12px;
  gap: 6px;
  .orn_dia {
    width: 6px;
    height: 6px;
  }
}
</style>
