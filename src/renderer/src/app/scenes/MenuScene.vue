<template>
  <div class="menu scene">
    <div class="scene_bg strong_dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>
    <div class="select_scene_head trans_drop_in"><Ornament kind="head" variant="page" :title="T('menu.heading')" /></div>
    <div v-hover-se class="select_row">
      <div
        v-for="(c, i) in heroineList"
        :key="c.id"
        class="char_card panel_glass orn_frame trans_raise_in"
        :class="`delay_${i + 1}`"
        @click="select(c)"
      >
        <div class="char_figure"><CharacterFigure :character-id="c.id" :face-id="2" /></div>
        <div class="char_info">
          <div class="char_name">{{ c.name }}</div>
          <div class="char_aka hint">{{ c.asKnownAs }}</div>
          <div class="char_record hint">{{ recordText(c.id) }}</div>
        </div>
        <div class="char_star_row">
          <span class="star_delta_chip" :class="deltaClass(deltaOf(c.id))"
            ><Shape kind="wings" :text="null" size="tiny" />{{ T("star.delta") }} <b>{{ signedDelta(deltaOf(c.id)) }}</b></span
          >
          <button class="btn sub mini star_btn" @click.stop="openStar(c)">{{ T("star.heading") }}</button>
        </div>
      </div>
    </div>
    <div v-hover-se class="menu_footer">
      <button class="btn sub small" @click="back">{{ T("common.back") }}</button>
      <button class="btn sub small" @click="openDialog('options')">{{ T("title.options") }}</button>
      <button class="btn sub small" @click="replayOpening">{{ T("title.opening") }}</button>
    </div>
  </div>
</template>

<script setup>
// メニュー (07): ヒロインのカード (xqueens MenuScene 風)。カード下に変動値とスターパレットへのボタン、戦績サマリ
import { onMounted } from "vue";
import { useSessionStore } from "../stores/session.js";
import { heroines, booksOf } from "@core/queries/index.js";
import { deltaOf as starDelta, normalize } from "@core/star/palette.js";
import { playSkitFor } from "../flow/skits.js";
import { oracleId } from "../flow/title.js";
import { deltaClass, signedDelta } from "../ui/star_view.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

const session = useSessionStore();
const heroineList = heroines();

onMounted(() => session.setBgm("title"));

function deltaOf(cid) {
  const p = session.characterProgress(cid);
  return starDelta(cid, normalize(cid, p.star.activeNodeIds, p));
}
function recordText(cid) {
  let tries = 0,
    clears = 0,
    best = null;
  for (const b of booksOf(cid)) {
    const r = session.record(cid, b.id);
    tries += r.tries;
    clears += r.normalEnds + r.happyEnds;
    if (r.bestDelta != null) best = best == null ? r.bestDelta : Math.min(best, r.bestDelta);
  }
  if (!tries) return T("menu.noRecord");
  return T("menu.records", { t: tries, c: clears }) + (best != null ? ` / ${T("menu.bestDelta", { n: signedDelta(best) })}` : "");
}
function select(c) {
  SoundManager.playSe("select");
  session.setScene("bookSelect", { characterId: c.id });
}
function openStar(c) {
  SoundManager.playSe("open");
  session.setScene("star", { characterId: c.id, back: "menu" });
}
function back() {
  SoundManager.playSe("cancel");
  session.setScene("title");
}
function openDialog(name) {
  SoundManager.playSe("open");
  session.openDialog(name);
}
function replayOpening() {
  SoundManager.playSe("ok");
  playSkitFor("opening", oracleId());
}
</script>

<style lang="scss" scoped>
.menu {
  overflow: hidden;
  .select_scene_head {
    position: absolute;
    top: 34px;
    left: 0;
    right: 0;
    :deep(.orn_head) {
      max-width: 880px;
      margin: 0 auto;
    }
  }
  .select_row {
    position: absolute;
    top: 120px;
    left: 0;
    right: 0;
    bottom: 90px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 28px;
  }
  .char_card {
    width: 300px;
    height: 500px;
    cursor: pointer;
    overflow: hidden;
    transition:
      transform 0.14s ease,
      box-shadow 0.14s ease;
    &:hover {
      transform: translateY(-6px);
      box-shadow:
        var(--shadow-panel),
        0 0 0 2px var(--color-main2);
    }
    .char_figure {
      position: absolute;
      left: -60px;
      top: 10px;
      width: 420px;
      height: 630px;
      pointer-events: none;
    }
    .char_info {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 46px;
      padding: 14px 18px;
      background: linear-gradient(180deg, rgba(31, 27, 25, 0), rgba(31, 27, 25, 0.92) 40%);
      .char_name {
        font-size: var(--font-size-large);
        color: var(--color-main1);
        text-shadow: 0 2px 0 var(--color-base5);
      }
      .char_record {
        margin-top: 6px;
        white-space: normal;
      }
    }
    .char_star_row {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px 6px;
      background: rgba(31, 27, 25, 0.92);
    }
  }
  .menu_footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 22px;
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}
.star_delta_chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-round);
  background: rgba(10, 10, 16, 0.55);
  border: 1px solid var(--color-base1);
  font-size: var(--font-size-mini);
  color: var(--color-white3);
  b {
    color: var(--color-white);
    font-size: var(--font-size-small);
    font-weight: normal;
  }
  &.neg b {
    color: var(--color-negative1);
  }
  &.pos b {
    color: var(--color-accent3);
  }
}
</style>
