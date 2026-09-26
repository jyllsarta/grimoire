<template>
  <DialogFrame :width="720" dialog-class="deck_dialog" close-on-backdrop @backdrop="close">
    <Ornament kind="head" :title="T('ingame.deck')" />
    <div class="deck_summary_line hint">{{ T("deck.summary", { n: rows.length, m: monsterCount }) }}</div>
    <div class="deck_grid no_scrollbar">
      <div v-for="r in rows" :key="r.uid" class="deck_ent" :class="[`k_${r.kind}`, { boss: r.boss }]" :data-desc="r.desc">
        <img class="icon_img" :src="r.icon" alt="" />
        <div class="deck_name">{{ r.name }}</div>
        <div class="deck_kind hint">{{ r.kindText }}</div>
      </div>
    </div>
    <div class="peek_buttons">
      <button class="btn sub" @click="close">{{ T("common.close") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// 残パネル一覧 (02: board.deck は公開情報)。ぬし は未配置なら末尾に出す
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { useRunStore } from "../stores/run.js";
import { iconPath, kindLabel } from "../ui/entity_view.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const emit = defineEmits(["close"]);
const run = useRunStore();
const ORDER = { enemy: 0, event: 1, equipment: 2, item: 3, ability: 4 };
const rows = computed(() => {
  const b = run.state.board;
  const list = b.deck.map((uid) => b.panels[uid]);
  if (!b.boss.placed && !b.boss.defeated && b.boss.uid != null) list.push(b.panels[b.boss.uid]);
  return list
    .map((p) => {
      const def = defOf(p);
      return {
        uid: p.uid,
        kind: p.kind,
        boss: p.isBoss,
        name: def.name,
        icon: iconPath(def.icon),
        desc: `${p.kind}:${p.defId}`,
        kindText:
          p.kind === "enemy"
            ? p.isBoss
              ? T("ingame.boss")
              : T("panel.monsterSub")
            : p.kind === "event"
              ? master.get("events", p.defId).kind === "misfortune"
                ? T("panel.misfortuneSub")
                : T("kind.event")
              : kindLabel(p.kind),
      };
    })
    .sort((a, b2) => ORDER[a.kind] - ORDER[b2.kind] || a.name.localeCompare(b2.name, "ja"));
});
const monsterCount = computed(() => rows.value.filter((r) => r.kind === "enemy").length);
function close() {
  SoundManager.playSe("cancel");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.deck_dialog) {
  padding: 26px 32px 20px;
}
.deck_summary_line {
  margin-top: 8px;
}
.deck_grid {
  margin-top: 12px;
  max-height: 420px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.deck_ent {
  padding: 8px 6px;
  border-radius: var(--radius-card);
  background: var(--color-base4);
  border: 1px solid var(--color-base1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: context-menu;
  img {
    width: 40px;
    height: 40px;
  }
  .deck_name {
    font-size: var(--font-size-mini);
    color: var(--color-white0);
    text-align: center;
  }
  &.k_enemy {
    border-color: var(--color-negative3);
  }
  &.k_event {
    border-color: var(--color-positive3);
  }
  &.boss {
    border-color: var(--color-negative1);
    box-shadow: 0 0 8px rgba(221, 92, 120, 0.5);
  }
}
</style>
