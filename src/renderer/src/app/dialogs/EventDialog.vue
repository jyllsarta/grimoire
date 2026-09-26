<template>
  <DialogFrame :width="640" dialog-class="event_dialog" :tone="misfortune ? 'bad' : ''" orn-frame>
    <template v-if="panel">
      <Ornament kind="head" variant="event" :title="misfortune ? T('event.misfortuneHead') : T('event.head')" :class="{ bad: misfortune }" />
      <div class="peek_head event_head">
        <div class="peek_icon"><img class="icon_img" :src="iconPath(event.icon)" alt="" /></div>
        <div>
          <div class="peek_title">{{ event.name }}</div>
          <div class="peek_desc">{{ event.description }}</div>
        </div>
      </div>
      <div class="choices">
        <button
          v-for="c in choices"
          :key="c.index"
          class="btn choice"
          :class="{ sub: c.index > 0, conditional: c.conditional, locked: !c.available }"
          :disabled="!c.available"
          :title="c.available ? '' : T('reason.choiceLocked')"
          @click="choose(c)"
        >
          <span v-if="c.conditional" class="cond_mark">◆</span>{{ c.available ? c.choice.label : T("event.lockedLabel") }}
        </button>
      </div>
      <div v-if="message" class="hint warn">{{ message }}</div>
      <Ornament kind="foot" variant="event" />
    </template>
  </DialogFrame>
</template>

<script setup>
// イベント (07): 説明と選択肢。条件付き選択肢は条件を満たさないと伏せる (FTL の青選択肢方式、R3 Q9)。
// 選ぶと chooseEvent → 結果ダイアログ (resultText)。不利イベントのカットインは fragments/effects.js (eventChoose)
import { computed, ref } from "vue";
import { master } from "@core/master/index.js";
import { panelAt, eventChoices } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { useSessionStore } from "../stores/session.js";
import { iconPath } from "../ui/entity_view.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const run = useRunStore();
const session = useSessionStore();
const message = ref("");
// 開いた時点のパネルを掴んでおく (選ぶとそのマスは落下で別のパネルになるので、cell を読み直してはいけない)
const panel = panelAt(run.state, props.dialog.params.cell);
const event = computed(() => master.get("events", panel.defId));
const misfortune = computed(() => event.value.kind === "misfortune");
const choices = computed(() => eventChoices(run.state, event.value.id));

function choose(c) {
  const ev = event.value;
  const r = run.dispatch("chooseEvent", { cell: props.dialog.params.cell, choiceIndex: c.index });
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
    return;
  }
  SoundManager.playSe(misfortune.value ? "break" : "ok");
  if (misfortune.value) session.markMisfortuneSeen(run.state.characterId, ev.id);
  emit("close", { choiceIndex: c.index });
  session.openDialog("eventResult", { eventId: ev.id, choiceId: c.choice.id });
}
</script>

<style lang="scss" scoped>
:deep(.event_dialog) {
  padding: 26px 34px 22px;
}
.event_head {
  margin-top: 16px;
}
.choices {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  .choice {
    justify-content: flex-start;
    text-align: left;
    &.conditional {
      outline-color: var(--color-positive1);
      border-color: var(--color-positive2);
      color: var(--color-positive0);
    }
    &.locked {
      color: var(--color-white3);
      filter: grayscale(0.6) brightness(0.7);
    }
    .cond_mark {
      color: var(--color-positive1);
      font-size: var(--font-size-mini);
    }
  }
}
.warn {
  margin-top: 8px;
  color: var(--color-negative1);
}
</style>
