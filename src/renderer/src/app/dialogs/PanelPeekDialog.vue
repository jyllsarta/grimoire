<template>
  <DialogFrame :width="560" dialog-class="peek_dialog" close-on-backdrop @backdrop="close">
    <template v-if="panel">
      <div class="peek_head">
        <div class="peek_icon"><img class="icon_img" :src="iconPath(def.icon)" alt="" /></div>
        <div>
          <div class="peek_title">{{ def.name }}</div>
          <div class="kind_line">
            <span class="chip">{{ kindLabel(panel.kind) }}</span>
          </div>
          <div class="peek_desc">{{ def.description }}</div>
        </div>
      </div>
      <Ornament kind="rule" />
      <div class="peek_body">
        <div class="stat_line">{{ panelStatLine(panel.kind, def) }}</div>
        <div v-if="effects.length" class="fx_line">
          <Shape v-for="(f, i) in effects" :key="i" :kind="f.shape" :text="f.n" size="small" />
        </div>
        <div v-if="panel.kind === 'ability'" class="hint recharge_line">{{ rechargeText }}</div>
        <div class="price_line">
          <span class="chip"><img class="icon_img coin" :src="COIN_ICON" alt="" />{{ T("panel.costLine", { n: cost }) }}</span>
          <span class="hint">{{ T("panel.wallet", { n: run.state.wallet.coin }) }}</span>
          <span v-if="!hasRoom" class="hint warn">{{ T("panel.noRoom") }}</span>
        </div>
        <div v-if="message" class="hint warn">{{ message }}</div>
      </div>
      <Ornament kind="foot" />
      <div class="peek_buttons">
        <button class="btn" :class="{ cannot: run.state.wallet.coin < cost }" @click="take">{{ T("panel.take", { n: cost }) }}</button>
        <button class="btn sub" @click="dump">{{ T("panel.dump") }}</button>
        <button class="btn sub" @click="close">{{ T("common.back") }}</button>
      </div>
    </template>
  </DialogFrame>
</template>

<script setup>
// パネルの覗き見 (tale peek dialog): 中身と価格を見て もらう / すてる / もどる
import { computed, ref } from "vue";
import { defOf } from "@core/domain/entity.js";
import { findFreePos } from "@core/domain/inventory.js";
import { panelAt, q, rechargeInfo } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { useTalkStore } from "../stores/talk.js";
import { iconPath, kindLabel, panelStatLine, entEffects, COIN_ICON } from "../ui/entity_view.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const run = useRunStore();
const talk = useTalkStore();
const message = ref("");
// 開いた時点のパネルを掴んでおく (もらう / すてる でそのマスは落下で別のパネルになる)
const panelSnapshot = panelAt(run.state, props.dialog.params.cell);
const panel = computed(() => panelSnapshot);
const def = computed(() => defOf(panel.value));
const effects = computed(() => entEffects(panel.value.kind, def.value, null));
const cost = computed(() => q(run.state).derive("panelCost", { def: def.value, panel: panel.value }));
const hasRoom = computed(() => findFreePos(run.state, def.value.size, q(run.state).derive("slotCount")) >= 0);
const rechargeText = computed(() => {
  const info = rechargeInfo({ kind: "ability", defId: def.value.id, ready: true, progress: 0 });
  return T(info.textKey, { n: info.target ?? "" });
});

function close() {
  SoundManager.playSe("cancel");
  emit("close", null);
}
function take() {
  const r = run.dispatch("takePanel", { cell: props.dialog.params.cell });
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
    return;
  }
  talk.say("treasureGet", { hop: true });
  emit("close", { taken: true });
}
function dump() {
  const r = run.dispatch("dumpPanel", { cell: props.dialog.params.cell });
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
    return;
  }
  emit("close", { dumped: true });
}
</script>

<style lang="scss" scoped>
:deep(.peek_dialog) {
  padding: 26px 32px 24px;
}
.kind_line {
  margin-top: 4px;
}
.stat_line {
  color: var(--color-main1);
  font-size: var(--font-size-small);
}
.fx_line {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}
.recharge_line {
  margin-top: 6px;
  white-space: normal;
}
.price_line {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  .coin {
    width: 18px;
    height: 18px;
  }
}
.warn {
  color: var(--color-negative1);
}
</style>
