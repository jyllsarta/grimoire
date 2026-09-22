<template>
  <div ref="stage" class="stage">
    <template v-if="session.loaded">
      <TitleScene v-if="session.scene === 'title'" />
      <MenuScene v-else-if="session.scene === 'menu'" />
      <template v-else-if="session.scene === 'inGame' && run.state">
        <ResultScene v-if="run.phase === 'ended'" />
        <IntermissionScene v-else-if="run.phase === 'intermission'" />
        <InGameScene v-else />
      </template>
      <StepMover v-if="run.state" />
      <Fragments />
      <SoundPanel class="sound_panel" />
      <button v-if="devTools" class="inspector_toggle" @click="inspector.toggle()">
        {{ T("inspector.title") }}
      </button>
      <Inspector v-if="devTools && inspector.open" class="inspector" />
    </template>
  </div>
</template>

<script setup>
// ============================================================
// GameWindow: 論理ステージ (1280x720 + CSS zoom)、シーン切替、一発物の振り分け (Fragments / Sound / Inspector)
// ============================================================
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { installViewport } from "@platform/viewport.js";
import { restoreWindowState } from "@platform/window.js";
import { edition } from "@platform/edition.js";
import { useSessionStore } from "./stores/session.js";
import { useRunStore, onDispatched } from "./stores/run.js";
import { useInspectorStore } from "./stores/inspector.js";
import { T } from "./text.js";
import { master } from "@core/master/index.js";
import SoundManager from "./sound/sound_manager.js";
import { EVENT_SE } from "./sound/sound_master.js";
import { fragmentsFor } from "./fragments/effects.js";
import Fragments from "./fragments/Fragments.vue";
import StepMover from "./StepMover.vue";
import SoundPanel from "./components/SoundPanel.vue";
import Inspector from "./inspector/Inspector.vue";
import TitleScene from "./scenes/TitleScene.vue";
import MenuScene from "./scenes/MenuScene.vue";
import InGameScene from "./scenes/InGameScene.vue";
import IntermissionScene from "./scenes/IntermissionScene.vue";
import ResultScene from "./scenes/ResultScene.vue";
import tables from "@masterdata/index.js";
import { runScenarioFromHash } from "./dev/scenarios.js";

const session = useSessionStore();
const run = useRunStore();
const inspector = useInspectorStore();
const stage = ref(null);
const devTools = !edition.isProd;
let uninstallViewport = null;
let unsubscribe = null;

onMounted(async () => {
  uninstallViewport = installViewport(stage.value);
  document.title = `${master.config.title} ${edition.version}${edition.name !== "prod" ? ` (${edition.name})` : ""}`;
  restoreWindowState((state) => (session.fullscreen = state.fullscreen));
  await session.load();
  SoundManager.setVolumes({ master: session.options.masterVolume, bgm: session.options.bgmVolume, se: session.options.seVolume });
  SoundManager.loadAll();
  if (devTools) inspector.setMasterWarnings(tables);

  // 一発物の振り分け: 音 → 演出 → インスペクタ
  unsubscribe = onDispatched((info) => {
    for (const e of info.events) {
      const se = EVENT_SE[e.type];
      if (se) SoundManager.playSe(se);
      fragmentsFor(e, info.state);
    }
    if (devTools) inspector.afterDispatch(info);
  });

  if (devTools) await runScenarioFromHash(location.hash);
});

onBeforeUnmount(() => {
  uninstallViewport?.();
  unsubscribe?.();
});

watch(
  () => session.bgm,
  (key) => SoundManager.playBgm(key),
);
watch(
  () => [session.options.masterVolume, session.options.bgmVolume, session.options.seVolume],
  ([master, bgm, se]) => SoundManager.setVolumes({ master, bgm, se }),
);
watch(
  () => run.epoch,
  () => {
    if (devTools) inspector.reset(run.state);
  },
);
</script>

<style lang="scss" scoped>
.stage {
  position: absolute;
  left: 0;
  top: 0;
  width: 1280px;
  height: 720px;
  overflow: hidden;
  background: var(--color-base5);
}

.sound_panel {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 800;
}

.inspector_toggle {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 950;
  padding: 2px 10px;
  border: 1px solid var(--color-base1);
  border-radius: var(--radius-card);
  background: rgba(31, 27, 25, 0.85);
  font-size: var(--font-size-mini);
  color: var(--color-white3);
}

.inspector {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  z-index: 940;
}
</style>
