<template>
  <div ref="stage" class="stage" @contextmenu.prevent="onContextMenu">
    <template v-if="session.loaded">
      <TitleScene v-if="session.scene === 'title'" />
      <MenuScene v-else-if="session.scene === 'menu'" />
      <BookSelectScene v-else-if="session.scene === 'bookSelect'" />
      <StarPaletteScene v-else-if="session.scene === 'star'" />
      <template v-else-if="session.scene === 'inGame' && run.state">
        <ResultScene v-if="run.phase === 'ended'" />
        <IntermissionScene v-else-if="run.phase === 'intermission'" />
        <InGameScene v-else />
      </template>
      <StepMover v-if="run.state" />
      <DialogHost />
      <Fragments />
      <CornerButtons :show-speed="session.scene === 'inGame'" />
      <button v-if="devTools" class="inspector_toggle" @click="inspector.toggle()">
        {{ T("inspector.title") }}
      </button>
      <Inspector v-if="devTools && inspector.open" class="inspector" />
    </template>
  </div>
</template>

<script setup>
// ============================================================
// GameWindow: 論理ステージ (1280x720 + CSS zoom)、シーン切替、ダイアログ置き場、一発物の振り分け (Fragments / Sound / Inspector)、
// 右クリック (個体説明 / tips)、非フォーカス時ミュート
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
import DialogHost from "./dialogs/DialogHost.vue";
import CornerButtons from "./components/CornerButtons.vue";
import Inspector from "./inspector/Inspector.vue";
import TitleScene from "./scenes/TitleScene.vue";
import MenuScene from "./scenes/MenuScene.vue";
import BookSelectScene from "./scenes/BookSelectScene.vue";
import StarPaletteScene from "./scenes/StarPaletteScene.vue";
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

// 右クリック: data-desc (個体説明) → data-tips (用語)。説明の上でもう一度右クリックすると閉じる
function onContextMenu(e) {
  const top = session.topDialog;
  if (top && (top.name === "detail" || top.name === "tips")) {
    session.closeDialog(top.id, null);
    return;
  }
  const descEl = e.target.closest?.("[data-desc]");
  if (descEl && descEl.dataset.desc) {
    session.openDialog("detail", { desc: descEl.dataset.desc, ref: descEl.dataset.descRef || null });
    return;
  }
  const tipsEl = e.target.closest?.("[data-tips]");
  if (tipsEl && tipsEl.dataset.tips) session.openDialog("tips", { key: tipsEl.dataset.tips });
}

function onBlur() {
  if (session.options.muteOnBlur) SoundManager.setMuted(true);
}
function onFocus() {
  SoundManager.setMuted(false);
}

onMounted(async () => {
  uninstallViewport = installViewport(stage.value);
  document.title = `${master.config.title} ${edition.version}${edition.name !== "prod" ? ` (${edition.name})` : ""}`;
  restoreWindowState((state) => (session.fullscreen = state.fullscreen));
  await session.load();
  SoundManager.setVolumes({ master: session.options.masterVolume, bgm: session.options.bgmVolume, se: session.options.seVolume });
  SoundManager.loadAll();
  if (devTools) inspector.setMasterWarnings(tables);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);

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
  window.removeEventListener("blur", onBlur);
  window.removeEventListener("focus", onFocus);
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
// シーンが変わったらダイアログを畳む (スキット待ちの Promise は null で解決)。
// sync で走らせる: setScene の直後に開くダイアログ (本のはじまりのスキット等) を巻き込まないため
watch(
  () => session.scene,
  () => session.closeAllDialogs(),
  { flush: "sync" },
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
