<template>
  <div class="chips" :class="{ reverse }">
    <span v-for="c in chips" :key="c.id" class="chip_item" :class="c.polarity" :data-tips="c.tips" :title="c.title">
      <Shape :kind="c.shape" :text="c.text" :size="size" />
      <i v-if="c.turns != null" class="turns">{{ c.turns }}</i>
    </span>
  </div>
</template>

<script setup>
// ステートチップ列 (04「表示の規則」): statuses (order 順) + unique + (unique が無く costume ≠ normal なら衣装チップ) + バフ (残りターン付き)。
// 図形は app/ui/shapes.js の STATUS_SHAPE。名前と値は title (ホバー) に
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { STATUS_SHAPE } from "../ui/shapes.js";
import Shape from "./Shape.vue";

const props = defineProps({
  statuses: { type: Array, default: () => [] },
  unique: { type: Object, default: null },
  costume: { type: String, default: null },
  buffs: { type: Array, default: () => [] },
  shield: { type: Number, default: 0 },
  shieldKind: { type: String, default: "shield" },
  size: { type: String, default: "small" },
  reverse: { type: Boolean, default: false },
});

const chips = computed(() => {
  const out = [];
  if (props.shield > 0)
    out.push({ id: "shield", shape: props.shieldKind, text: props.shield, polarity: "neutral", tips: "shield", title: `シールド ${props.shield}` });
  const rows = props.statuses.map((s) => ({ s, def: master.byKey("statuses", s.key) })).sort((a, b) => a.def.order - b.def.order);
  for (const { s, def } of rows) {
    out.push({
      id: `s:${s.key}`,
      shape: STATUS_SHAPE[s.key] || "status",
      text: def.polarity === "good" ? `+${s.value}` : s.value,
      polarity: def.polarity,
      tips: def.kind === "unique" ? "unique" : def.polarity === "good" ? "good" : s.key,
      title: `${def.name} ${s.value}`,
    });
  }
  if (props.unique) {
    const def = master.byKey("statuses", props.unique.key);
    out.push({
      id: "unique",
      shape: STATUS_SHAPE[props.unique.key] || "status",
      text: props.unique.turns,
      polarity: "bad",
      tips: "unique",
      title: `${def.name} ${props.unique.turns}`,
    });
  } else if (props.costume && props.costume !== "normal") {
    const def = master.byKey("statuses", props.costume);
    out.push({ id: "costume", shape: STATUS_SHAPE[props.costume] || "costume", text: null, polarity: "neutral", tips: "costume", title: def.name });
  }
  for (const b of props.buffs) {
    const def = master.byKey("statuses", b.key);
    const shape = b.key === "blockDelta" ? "block" : b.value >= 0 ? "powerUp" : "powerDown";
    out.push({
      id: `b:${b.key}`,
      shape,
      text: `${b.value >= 0 ? "+" : ""}${b.value}`,
      polarity: "neutral",
      tips: "buff",
      turns: b.turns < 0 ? "∞" : b.turns,
      title: `${def.name} ${b.value >= 0 ? "+" : ""}${b.value} (${b.turns < 0 ? "バトル中" : `${b.turns} 回`})`,
    });
  }
  return out;
});
</script>

<style lang="scss" scoped>
.chips {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  &.reverse {
    flex-direction: row-reverse;
  }
}
.chip_item {
  display: inline-flex;
  align-items: flex-end;
  gap: 1px;
  .turns {
    font-style: normal;
    font-size: var(--font-size-mini);
    color: var(--color-white3);
  }
}
</style>
