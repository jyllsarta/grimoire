<template>
  <DialogFrame :width="560" dialog-class="savedata_dialog" :z-index="650">
    <Ornament kind="head" :title="T('savedata.heading')" />
    <div class="save_rows">
      <div class="save_row">
        <span class="lbl">{{ T("savedata.createdAt") }}</span
        ><span>{{ dateText(session.progress.meta.createdAt) }}</span>
      </div>
      <div class="save_row">
        <span class="lbl">{{ T("savedata.updatedAt") }}</span
        ><span>{{ dateText(session.progress.meta.updatedAt) }}</span>
      </div>
      <div class="save_row">
        <span class="lbl">{{ T("savedata.runs") }}</span
        ><span>{{ totals.tries }}</span>
      </div>
      <div class="save_row">
        <span class="lbl">{{ T("savedata.clears") }}</span
        ><span>{{ totals.clears }}</span>
      </div>
      <div class="save_row">
        <span class="lbl">{{ T("savedata.crowns") }}</span
        ><span>{{ totals.crowns }}</span>
      </div>
      <div class="save_row">
        <span class="lbl">{{ T("savedata.runSave") }}</span
        ><span>{{ session.hasRunSave ? T("common.yes") : T("common.no") }}</span>
      </div>
    </div>
    <Ornament kind="foot" />
    <div class="peek_buttons">
      <button class="btn danger" @click="reset">{{ T("savedata.reset") }}</button>
      <button class="btn sub" @click="close">{{ T("common.close") }}</button>
    </div>
  </DialogFrame>
</template>

<script setup>
// セーブ管理 (06): 進行データの概要と初期化 (確認つき)
import { computed } from "vue";
import { useSessionStore } from "../stores/session.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";

const emit = defineEmits(["close"]);
const session = useSessionStore();
const totals = computed(() => {
  let tries = 0,
    clears = 0,
    crowns = 0;
  for (const c of Object.values(session.progress.characters)) {
    crowns += c.totalCrowns ?? 0;
    for (const r of Object.values(c.records ?? {})) {
      tries += r.tries ?? 0;
      clears += (r.normalEnds ?? 0) + (r.happyEnds ?? 0);
    }
  }
  return { tries, clears, crowns };
});
const dateText = (ms) => (ms ? new Date(ms).toLocaleString("ja-JP") : "-");
async function reset() {
  const yes = await session.openDialog("confirm", { text: T("savedata.resetConfirm"), yes: T("savedata.reset"), danger: true });
  if (!yes) return;
  await session.reset();
  SoundManager.playSe("break");
  emit("close", { reset: true });
}
function close() {
  SoundManager.playSe("close");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.savedata_dialog) {
  padding: 26px 34px 22px;
}
.save_rows {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--font-size-small);
  .save_row {
    display: flex;
    gap: 14px;
    .lbl {
      width: 160px;
      color: var(--color-white3);
    }
  }
}
</style>
