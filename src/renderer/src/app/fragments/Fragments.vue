<template>
  <div class="fragments">
    <component :is="componentFor(f.type)" v-for="f in fragmentStore.active" :key="f.id" :fragment="f" @remove="removeFragment" />
  </div>
</template>

<script setup>
import { fragmentStore, removeFragment } from "./fragment_store.js";
import MessageBar from "./MessageBar.vue";
import Toast from "./Toast.vue";
import NumberPop from "./NumberPop.vue";

// フラグメント type → コンポーネント。演出を増やす時はここに足す
const registry = { MessageBar, Toast, NumberPop };

function componentFor(type) {
  const component = registry[type];
  if (!component) console.warn(`[fragments] unknown fragment type: ${type}`);
  return component || Toast;
}
</script>

<style scoped>
.fragments {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 900;
}
</style>
