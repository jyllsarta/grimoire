<template>
  <div class="chips">
    <span v-for="s in chips" :key="s.key" class="chip" :class="s.polarity">{{ s.name }} {{ s.value }}</span>
  </div>
</template>

<script setup>
// ステートチップ列 (04「表示の規則」): statuses (order 順) + unique + (unique が無く costume ≠ normal なら衣装チップ)
import { computed } from "vue";
import { master } from "@core/master/index.js";

const props = defineProps({
  statuses: { type: Array, default: () => [] },
  unique: { type: Object, default: null },
  costume: { type: String, default: null },
  buffs: { type: Array, default: () => [] },
});

const chips = computed(() => {
  const out = props.statuses.map((s) => ({ key: s.key, value: s.value, ...master.byKey("statuses", s.key) }));
  out.sort((a, b) => a.order - b.order);
  if (props.unique) out.push({ key: props.unique.key, value: props.unique.turns, ...master.byKey("statuses", props.unique.key) });
  else if (props.costume && props.costume !== "normal") out.push({ key: props.costume, value: "", ...master.byKey("statuses", props.costume) });
  for (const b of props.buffs)
    out.push({ key: `buff.${b.key}`, value: `${b.value > 0 ? "+" : ""}${b.value} (${b.turns})`, ...master.byKey("statuses", b.key) });
  return out;
});
</script>

<style lang="scss" scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
