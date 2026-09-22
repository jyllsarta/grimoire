<template>
  <div class="intermission">
    <div class="header">
      <div class="heading">{{ T("intermission.heading") }}</div>
      <div class="wallet">
        <span class="chip">{{ T("intermission.jewel") }} {{ state.wallet.jewel }}</span>
        <span class="chip">{{ T("intermission.crown") }} {{ state.wallet.crown }}</span>
        <span class="chip">{{ T("ingame.life") }} {{ state.player.hp }} / {{ qq.derive("maxHp") }}</span>
      </div>
    </div>
    <div class="body">
      <div class="shop panel_glass">
        <div class="heading">おかいもの</div>
        <div class="slots">
          <button
            v-for="(slot, i) in state.shop.slots"
            :key="i"
            class="slot"
            :class="{ soldOut: slot.soldOut }"
            :disabled="slot.soldOut"
            @click="buy(i)"
          >
            <div class="kind hint">{{ slot.kind }}{{ slot.rare ? " ★" : "" }}</div>
            <div class="name">{{ nameOf(slot) }}</div>
            <div class="price hint">{{ slot.soldOut ? T("intermission.soldOut") : priceText(slot) }}</div>
          </button>
        </div>
        <div class="row">
          <button class="btn sub small" @click="cmd('rerollShop')">{{ T("intermission.reroll", { n: qq.derive("rerollPrice") }) }}</button>
          <button class="btn sub small" @click="cmd('buyHeal')">{{ T("intermission.heal", { n: qq.derive("healPrice") }) }}</button>
        </div>
        <div v-if="message" class="hint">{{ message }}</div>
      </div>
      <div class="next panel_glass">
        <div class="heading">つぎの章</div>
        <div v-if="nextId">{{ master.get("chapters", nextId).name }}</div>
        <div class="hint">{{ nextSpecs }}</div>
        <InventoryBar />
        <button class="btn go" @click="cmd('enterNextChapter')">{{ T("intermission.go") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { master } from "@core/master/index.js";
import { q, chapterSequence } from "@core/queries/index.js";
import { defOf } from "@core/domain/entity.js";
import { slotPrice } from "@core/domain/shop.js";
import { T, reasonText } from "../text.js";
import InventoryBar from "../components/InventoryBar.vue";

const session = useSessionStore();
const run = useRunStore();
const state = computed(() => run.state);
const qq = computed(() => q(run.state));
const message = ref("");
const nextId = computed(() => chapterSequence(run.state)[run.state.progress.chapterIndex + 1] ?? null);
const nextSpecs = computed(() => {
  if (!nextId.value) return "";
  const specs = qq.value.ctx.list("chapterPanelSpecs", { chapterId: nextId.value });
  const counts = {};
  for (const s of specs) counts[s.kind] = (counts[s.kind] || 0) + 1;
  return Object.entries(counts)
    .map(([k, n]) => `${k} ×${n}`)
    .join(" / ");
});

onMounted(() => session.setBgm("shop"));

function nameOf(slot) {
  return defOf(slot.kind, slot.defId).name;
}
function priceText(slot) {
  const p = slotPrice(slot);
  return `${p.jewel} ジュエル${p.crown ? ` + ${p.crown} クラウン` : ""}`;
}
function cmd(name, args) {
  const r = run.dispatch(name, args);
  message.value = r.ok ? "" : reasonText(r.reason);
}
function buy(i) {
  cmd("buyShopSlot", { index: i });
}
</script>

<style lang="scss" scoped>
.intermission {
  position: absolute;
  inset: 0;
  padding: 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: radial-gradient(ellipse at 50% 20%, var(--color-base4), var(--color-base5) 70%);
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .wallet {
    display: flex;
    gap: 8px;
  }
  .body {
    display: flex;
    gap: 24px;
    flex: 1;
    min-height: 0;
  }
  .shop {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .slots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .slot {
    padding: 10px;
    border-radius: var(--radius-card);
    background: var(--color-base4);
    border: 1px solid var(--color-base1);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: var(--shadow-card);
    &.soldOut {
      opacity: 0.5;
    }
    .name {
      color: var(--color-main1);
    }
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .next {
    width: 460px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .go {
    align-self: flex-end;
    margin-top: auto;
  }
}
</style>
