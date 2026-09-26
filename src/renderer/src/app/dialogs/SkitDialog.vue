<template>
  <div class="skit_overlay" :class="[skit.type, { scene_form: skit.type === 'scene' }]" @click="next">
    <!-- scene 形式: 一枚絵を中央に (秘匿シーン。無ければ黒のまま) -->
    <template v-if="skit.type === 'scene'">
      <div class="scene_bg_blur" :style="bgStyle"></div>
      <div v-if="line?.imageId" class="scene_image">
        <img :src="`grimoire_scenes/scene${skit.id}_${line.imageId}.png`" alt="" @error="imageMissing = true" />
      </div>
      <div v-if="imageMissing" class="scene_missing">{{ T("skit.sceneMissing") }}</div>
    </template>
    <!-- talk 形式: 立ち絵は左、話者が変わると入れ替わる -->
    <template v-else>
      <div class="scene_bg_blur" :style="bgStyle"></div>
      <div v-if="figureId != null" :key="figureId" class="skit_chara" :class="{ player_talking: isProtagonist }">
        <CharacterFigure :character-id="figureId" :face-id="figureFace" />
      </div>
    </template>

    <div class="skit_box panel_glass orn_frame" :class="{ scene_box: skit.type === 'scene' }">
      <div class="skit_name">{{ speakerName }}</div>
      <div :key="line?.id" class="skit_text">
        <span v-for="(ch, i) in shownText" :key="i" class="ch" :style="{ animationDelay: `${i * 14}ms` }">{{ ch }}</span>
      </div>
      <div class="skit_next_hint">{{ isLast ? T("skit.end") : T("skit.next") }}</div>
    </div>
    <button class="btn sub mini skit_skip" @click.stop="finish">{{ T("skit.skip") }}</button>
    <div class="skit_progress">{{ index + 1 }} / {{ lines.length }}</div>
  </div>
</template>

<script setup>
// スキット (07): talk 形式は立ち絵 + 名札付きの箱、scene 形式は一枚絵 (grimoire_scenes/scene<skitId>_<imageId>.png) + 箱。
// クリックで次へ。最後のクリックで閉じる。既読は session.markSkitRead
import { computed, onMounted, ref } from "vue";
import { master } from "@core/master/index.js";
import { useSessionStore } from "../stores/session.js";
import { skitLines } from "../flow/skits.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const session = useSessionStore();
const skit = computed(() => master.get("skits", props.dialog.params.skitId));
const lines = computed(() => skitLines(skit.value.id));
const index = ref(0);
const line = computed(() => lines.value[index.value] ?? null);
const isLast = computed(() => index.value >= lines.value.length - 1);
const imageMissing = ref(false);
const isProtagonist = computed(() => line.value?.speaker === "protagonist");
const speakerCharacter = computed(() => (line.value && !isProtagonist.value ? master.findByKey("characters", line.value.speaker) : null));
const speakerName = computed(() => (isProtagonist.value ? T("skit.protagonist") : (speakerCharacter.value?.name ?? line.value?.speaker ?? "")));
const shownText = computed(() => [...(line.value?.text ?? "")]);

// talk 形式の立ち絵: 直近に喋った character を出しておく (主人公の番は暗くする)
const lastFigure = ref(null);
const figureId = computed(() => (speakerCharacter.value ? speakerCharacter.value.id : (lastFigure.value?.id ?? null)));
const figureFace = computed(() => (speakerCharacter.value ? (line.value.faceId ?? 1) : (lastFigure.value?.face ?? 1)));
const bgStyle = { backgroundImage: "url(assets/backgrounds/toshokan.png)" };

function remember() {
  if (speakerCharacter.value) lastFigure.value = { id: speakerCharacter.value.id, face: line.value.faceId ?? 1 };
  if (line.value?.soundId) SoundManager.playSe(line.value.soundId);
  imageMissing.value = false;
}
function next() {
  if (isLast.value) {
    finish();
    return;
  }
  SoundManager.playSe("select");
  index.value += 1;
  remember();
}
function finish() {
  SoundManager.playSe("close");
  emit("close", { skitId: skit.value.id });
}
onMounted(() => {
  remember();
  session.markSkitRead(skit.value.characterId, skit.value.id);
});
</script>

<style lang="scss" scoped>
.skit_overlay {
  position: absolute;
  inset: 0;
  background: rgba(12, 9, 8, 0.86);
  z-index: 400;
  cursor: pointer;
  overflow: hidden;
  animation: skit_in 0.25s ease both;
  .scene_bg_blur {
    position: absolute;
    inset: -30px;
    background-size: cover;
    background-position: center;
    filter: blur(8px) brightness(0.35);
  }
  .scene_image {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
      height: 100%;
      width: auto;
      max-width: 100%;
      object-fit: contain;
    }
  }
  .scene_missing {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translateX(-50%);
    color: var(--color-white3);
    font-size: var(--font-size-small);
    letter-spacing: 0.2em;
  }
  .skit_chara {
    position: absolute;
    left: 40px;
    bottom: -240px;
    width: 640px;
    height: 960px;
    pointer-events: none;
    animation: skit_chara_in 0.2s ease-out both;
    transition: filter 0.2s ease;
    &.player_talking {
      filter: brightness(0.6);
    }
  }
  .skit_box {
    position: absolute;
    left: 320px;
    right: 90px;
    bottom: 70px;
    min-height: 150px;
    padding: 20px 30px;
    &.scene_box {
      left: 120px;
      right: 120px;
      bottom: 40px;
    }
  }
  .skit_name {
    position: absolute;
    top: -22px;
    left: 26px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 6px 20px;
    background: linear-gradient(180deg, var(--color-main2), var(--color-main4));
    color: var(--color-base5);
    border-radius: var(--radius-button);
    font-size: var(--font-size-normal);
    outline: 1px solid rgba(255, 241, 216, 0.45);
    outline-offset: -4px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      0 3px 6px rgba(0, 0, 0, 0.4);
    z-index: 1;
    &::before,
    &::after {
      content: "";
      width: 6px;
      height: 6px;
      flex: none;
      background: currentColor;
      opacity: 0.55;
      transform: rotate(45deg);
    }
  }
  .skit_text {
    margin-top: 14px;
    font-size: var(--font-size-medium);
    line-height: 1.7;
    min-height: 76px;
    color: var(--color-white0);
    .ch {
      animation: skit_ch 0.12s ease both;
      white-space: pre-wrap;
    }
  }
  .skit_next_hint {
    position: absolute;
    right: 20px;
    bottom: 10px;
    color: var(--color-white3);
    font-size: var(--font-size-mini);
    animation: skit_hint_blink 1.4s ease infinite;
  }
  .skit_skip {
    position: absolute;
    right: 24px;
    top: 18px;
    z-index: 2;
  }
  .skit_progress {
    position: absolute;
    left: 24px;
    top: 22px;
    color: var(--color-white3);
    font-size: var(--font-size-mini);
  }
}
@keyframes skit_in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes skit_chara_in {
  from {
    transform: translateY(12px);
    opacity: 0.6;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
@keyframes skit_ch {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes skit_hint_blink {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.25;
  }
}
</style>
