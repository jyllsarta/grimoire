<template>
  <div class="node" :class="{ changed: isChanged }">
    <template v-if="isObject">
      <div class="line" @click="open = !open">
        <span class="toggle">{{ open ? "▾" : "▸" }}</span>
        <span v-if="label !== null" class="key">{{ label }}</span>
        <span class="hint">{{ summary }}</span>
      </div>
      <div v-if="open" class="children">
        <JsonTree v-for="(v, k) in value" :key="k" :value="v" :label="String(k)" :path="path ? `${path}.${k}` : String(k)" :changed="changed" />
      </div>
    </template>
    <div v-else class="line">
      <span v-if="label !== null" class="key">{{ label }}</span>
      <span class="value" :class="typeof value">{{ JSON.stringify(value) }}</span>
    </div>
  </div>
</template>

<script setup>
// state の JSON ツリー。直前のコマンドで変わったパス (changed) を光らせる
import { computed, ref } from "vue";

const props = defineProps({
  value: { type: [Object, Array, String, Number, Boolean, null], required: true },
  label: { type: String, default: null },
  path: { type: String, default: "" },
  changed: { type: Set, default: () => new Set() },
});
const isObject = computed(() => props.value !== null && typeof props.value === "object");
const summary = computed(() => (Array.isArray(props.value) ? `[${props.value.length}]` : `{${Object.keys(props.value).length}}`));
const open = ref(props.path.split(".").length <= 1);
const isChanged = computed(() => {
  if (!props.path) return false;
  for (const p of props.changed) if (p === props.path || p.startsWith(props.path + ".")) return true;
  return false;
});
</script>

<style lang="scss" scoped>
.node {
  font-family: Consolas, monospace;
  line-height: 1.35;
  &.changed > .line {
    animation: glow 2s ease-out;
  }
  .line {
    display: flex;
    gap: 6px;
    cursor: default;
    white-space: nowrap;
  }
  .toggle {
    color: var(--color-white3);
    width: 10px;
  }
  .key {
    color: var(--color-main2);
  }
  .value.number {
    color: var(--color-positive1);
  }
  .value.string {
    color: var(--color-accent2);
  }
  .value.boolean {
    color: var(--color-d1);
  }
  .children {
    margin-left: 14px;
    border-left: 1px solid var(--color-base3);
    padding-left: 6px;
  }
}
@keyframes glow {
  0% {
    background: var(--color-main5);
  }
  100% {
    background: transparent;
  }
}
</style>
