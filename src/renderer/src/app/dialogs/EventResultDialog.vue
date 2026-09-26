<template>
  <DialogFrame :width="600" dialog-class="event_result" :z-index="210" close-on-backdrop @backdrop="close">
    <Ornament kind="head" variant="event" :title="event.name" />
    <div class="result_text">{{ choice.resultText || choice.label }}</div>
    <div v-if="effectChips.length" class="effect_chips">
      <span v-for="(e, i) in effectChips" :key="i" class="chip" :class="e.cls">{{ e.text }}</span>
    </div>
    <Ornament kind="foot" variant="event" />
    <div class="peek_buttons">
      <button class="btn" @click="close">{{ T("common.close") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// イベントの結果 (選んだ選択肢の resultText)。効果の要約チップはマスタの effects をそのまま読む
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const event = computed(() => master.get("events", props.dialog.params.eventId));
const choice = computed(() => master.get("eventChoices", props.dialog.params.choiceId));
const effectChips = computed(() =>
  (choice.value.effects || []).map((e) => {
    switch (e.type) {
      case "coins":
        return { text: T("event.fx.coins", { n: `${e.value > 0 ? "+" : ""}${e.value}` }), cls: e.value >= 0 ? "good" : "bad" };
      case "hp":
        return { text: T("event.fx.hp", { n: `${e.value > 0 ? "+" : ""}${e.value}` }), cls: e.value >= 0 ? "good" : "bad" };
      case "gainEquipment":
        return { text: T("event.fx.gain", { name: defOf("equipment", e.value).name }), cls: "good" };
      case "gainItem":
        return { text: T("event.fx.gain", { name: defOf("item", e.value).name }), cls: "good" };
      case "gainAbility":
        return { text: T("event.fx.gain", { name: defOf("ability", e.value).name }), cls: "good" };
      case "status": {
        const def = master.get("statuses", e.value);
        return { text: `${def.name} ${e.value2 ?? 1}`, cls: def.polarity === "good" ? "good" : "bad" };
      }
      case "crossBreak":
        return { text: T("event.fx.crossBreak"), cls: "bad" };
      case "loseAllEntities":
        return { text: T("event.fx.loseAllEntities"), cls: "bad" };
      case "loseAllCoins":
        return { text: T("event.fx.loseAllCoins"), cls: "bad" };
      case "harshness":
        return { text: T("event.fx.harshness", { n: e.value ?? 1 }), cls: "bad" };
      default:
        return { text: e.type, cls: "" };
    }
  }),
);
function close() {
  SoundManager.playSe("close");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.event_result) {
  padding: 26px 34px 22px;
}
.result_text {
  margin-top: 18px;
  line-height: 1.8;
  color: var(--color-white0);
  white-space: pre-wrap;
}
.effect_chips {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
