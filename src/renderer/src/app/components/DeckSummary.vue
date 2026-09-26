<template>
  <div class="deck_summary panel_glass" data-tips="deck" @click="open">
    <div class="sum_chunk">
      <img class="icon_img" :src="iconPath('card')" alt="" /><span class="value">{{ counts.panels }}</span>
    </div>
    <div class="sum_chunk">
      <img class="icon_img" :src="iconPath('enemy')" alt="" /><span class="value">{{ counts.monsters }}</span>
    </div>
    <span class="sum_more">▸</span>
  </div>
</template>

<script setup>
// 残パネルのサマリ (tale deck_summary)。クリックで一覧ダイアログ
import { computed } from "vue";
import { useRunStore } from "../stores/run.js";
import { useSessionStore } from "../stores/session.js";
import { iconPath } from "../ui/entity_view.js";
import SoundManager from "../sound/sound_manager.js";

const run = useRunStore();
const session = useSessionStore();
const counts = computed(() => {
  const b = run.state.board;
  let panels = b.deck.length;
  let monsters = b.deck.filter((uid) => b.panels[uid].kind === "enemy").length;
  if (!b.boss.placed && !b.boss.defeated) {
    panels += 1;
    monsters += 1;
  }
  return { panels, monsters };
});
function open() {
  SoundManager.playSe("open");
  session.openDialog("deck");
}
</script>

<style lang="scss" scoped>
.deck_summary {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  cursor: pointer;
  transition:
    filter 0.1s ease,
    box-shadow 0.12s ease;
  &:hover {
    filter: brightness(1.12);
    box-shadow:
      0 8px 28px rgba(0, 0, 0, 0.45),
      0 0 0 2px var(--color-main1);
  }
  .sum_chunk .value {
    font-size: var(--font-size-large);
    color: var(--color-white0);
  }
  .sum_more {
    margin-left: auto;
    color: var(--color-white3);
    font-size: var(--font-size-small);
  }
}
</style>
