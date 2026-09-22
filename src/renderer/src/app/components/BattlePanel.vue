<template>
  <div class="battle panel_glass">
    <div class="side player">
      <div class="heading">{{ character.name }}</div>
      <div class="stat">
        {{ T("ingame.life") }} <b>{{ state.player.hp }}</b> / {{ qq.derive("maxHp") }}
        <span v-if="battle.shield" class="chip">{{ T("battle.shield") }} {{ battle.shield }}</span>
      </div>
      <div class="hint">
        {{ T("battle.attack") }} {{ attack.value }} / {{ T("battle.block") }} {{ qq.derive("blockValue") }}
        <span v-if="flags.length"> / {{ flags.join(", ") }}</span>
      </div>
      <StatusChips :statuses="state.player.statuses" :unique="state.player.unique" :costume="state.player.costume" :buffs="battle.buffs" />
    </div>
    <div class="middle">
      <div class="turn">{{ T("battle.turn", { n: battle.turn }) }}</div>
      <div class="step hint">
        {{ battle.step }}<span v-if="battle.step === 'enemy.action'"> [{{ battle.cursor }}]</span>
      </div>
      <div class="buttons">
        <template v-if="battle.step === 'select'">
          <button class="btn" :class="{ zzz: !canAct.ok }" @click="cmd('attack')">{{ canAct.ok ? T("battle.attack") : "zzz" }}</button>
          <button class="btn sub" @click="cmd('flee')">{{ T("battle.flee") }}</button>
          <button v-if="!battle.started" class="btn sub small" @click="cmd('cancelBattle')">{{ T("battle.cancel") }}</button>
        </template>
        <button v-else-if="battle.step === 'battle.end'" class="btn" @click="cmd('closeBattle')">{{ T("battle.close") }}</button>
        <div v-else class="hint">…</div>
      </div>
    </div>
    <div class="side enemy">
      <div class="heading">
        {{ enemyDef.name }}<span v-if="panel.isBoss"> ({{ T("ingame.boss") }})</span>
      </div>
      <div class="stat">
        ♥ <b>{{ Math.max(0, enemy.hp) }}</b> / {{ qq.derive("enemyMaxHp", { defId: panel.defId }) }}
        <span v-if="enemy.block" class="chip">{{ T("battle.block") }} {{ enemy.block }}</span>
        <span v-if="enemy.stunned" class="chip bad">{{ T("battle.stunned") }}</span>
      </div>
      <div class="routine hint">
        <div v-for="(r, i) in routines" :key="r.id" :class="{ now: i === enemy.routineIndex % routines.length }">
          {{ r.name }}: {{ r.actions.map((a) => `${a.type}${a.value ? ` ${a.value}` : ""}`).join(" / ") }}
        </div>
      </div>
      <StatusChips :statuses="enemy.statuses" :buffs="enemy.buffs" />
    </div>
  </div>
</template>

<script setup>
// 戦闘パネル。battle.step / cursor をそのまま表示し、select のときだけボタンが効く
import { computed } from "vue";
import { useRunStore } from "../stores/run.js";
import { master } from "@core/master/index.js";
import { q } from "@core/queries/index.js";
import { enemyRoutines } from "@core/domain/board.js";
import { T, reasonText } from "../text.js";
import StatusChips from "./StatusChips.vue";

const emit = defineEmits(["message"]);
const run = useRunStore();
const state = computed(() => run.state);
const battle = computed(() => run.state.battle);
const panel = computed(() => run.state.board.panels[run.state.battle.panelUid]);
const enemy = computed(() => panel.value.enemy);
const enemyDef = computed(() => master.get("enemies", panel.value.defId));
const character = computed(() => master.get("characters", run.state.characterId));
const qq = computed(() => q(run.state));
const attack = computed(() => qq.value.breakdown("attackPower"));
const flags = computed(() => qq.value.derive("strikeFlags"));
const canAct = computed(() => qq.value.canAct());
const routines = computed(() => enemyRoutines(panel.value.defId));

function cmd(name, args) {
  const r = run.dispatch(name, args);
  emit("message", r.ok ? "" : reasonText(r.reason));
}
</script>

<style lang="scss" scoped>
.battle {
  display: flex;
  gap: 12px;
  padding: 14px;
  min-height: 190px;
  .side {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    .stat b {
      font-size: var(--font-size-large);
      color: var(--color-main1);
    }
  }
  .player .stat b {
    color: var(--shape-life);
  }
  .enemy .stat b {
    color: var(--shape-harm);
  }
  .middle {
    width: 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    .turn {
      font-size: var(--font-size-medium);
      color: var(--color-main1);
    }
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }
    .zzz {
      filter: saturate(0.3);
    }
  }
  .routine .now {
    color: var(--color-main1);
  }
}
</style>
