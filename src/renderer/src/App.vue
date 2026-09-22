<template>
  <div class="app" :class="language" @contextmenu.prevent>
    <GameWindow />
  </div>
</template>

<script setup>
import { computed } from "vue";
import GameWindow from "./app/GameWindow.vue";
import { useSessionStore } from "./app/stores/session.js";

const session = useSessionStore();
const language = computed(() => session.language);
</script>

<style lang="scss">
.app {
  width: 100%;
  height: 100%;
}
</style>
