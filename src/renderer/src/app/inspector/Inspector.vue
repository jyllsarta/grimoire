<template>
  <div class="inspector">
    <div class="tabs">
      <button v-for="t in tabs" :key="t" class="tab" :class="{ on: inspector.tab === t }" @click="inspector.tab = t">{{ t }}</button>
      <span class="badge" :class="{ warn: inspector.masterWarnings.length, err: inspector.invariants.length }">
        {{
          inspector.invariants.length
            ? `不変条件 ${inspector.invariants.length}`
            : inspector.masterWarnings.length
              ? `マスタ ${inspector.masterWarnings.length}`
              : "OK"
        }}
      </span>
    </div>

    <div v-if="!run.state" class="body hint">state なし (ランを始めるか、#ingame で開く)</div>

    <div v-else-if="inspector.tab === 'state'" class="body">
      <div class="row">
        <span class="hint">phase {{ run.phase }} / step {{ run.state.battle?.step ?? "-" }} / epoch {{ run.epoch }}</span>
      </div>
      <JsonTree :value="run.state" path="" :changed="changedSet" />
    </div>

    <div v-else-if="inspector.tab === 'command'" class="body">
      <div class="heading_s">直前のコマンド</div>
      <pre class="code">{{
        inspector.lastCommand
          ? `${inspector.lastCommand.name}(${JSON.stringify(inspector.lastCommand.args)}) → ${JSON.stringify(inspector.lastCommand.result)}`
          : "-"
      }}</pre>
      <div class="heading_s">一発物 ({{ inspector.lastEvents.length }})</div>
      <div v-for="(e, i) in inspector.lastEvents" :key="i" class="event">
        <b>{{ e.type }}</b> <span class="hint">{{ JSON.stringify(e.payload) }}</span>
      </div>
      <div class="heading_s">履歴</div>
      <div v-for="(h, i) in inspector.history" :key="i" class="hist" :class="{ ng: !h.ok }">
        {{ h.name }}{{ h.args !== "{}" ? h.args : "" }} {{ h.ok ? "" : `✗ ${h.reason}` }}
        <span class="hint">{{ h.step ?? "" }} ev{{ h.events }}</span>
      </div>
    </div>

    <div v-else-if="inspector.tab === 'derive'" class="body">
      <select v-model="derivedName">
        <option v-for="n in derivable" :key="n" :value="n">{{ n }}</option>
      </select>
      <pre class="code">{{ breakdownText }}</pre>
      <div class="heading_s">許可</div>
      <div v-for="p in permissions" :key="p.name" class="event">
        <b>{{ p.name }}</b> {{ p.ok ? "ok" : `✗ ${p.reason}` }}
      </div>
    </div>

    <div v-else-if="inspector.tab === 'order'" class="body">
      <select v-model="stepName">
        <option v-for="n in STEP_NAMES" :key="n" :value="n">{{ n }}</option>
      </select>
      <div v-for="(h, i) in order" :key="i" class="event">
        <span class="hint">{{ h.order }}</span> {{ h.name }}<span v-if="h.uid" class="hint"> #{{ h.uid }}</span>
      </div>
      <div v-if="!order.length" class="hint">ハンドラなし</div>
    </div>

    <div v-else-if="inspector.tab === 'check'" class="body">
      <div class="heading_s">不変条件</div>
      <div v-if="!inspector.invariants.length" class="hint">違反なし</div>
      <div v-for="(v, i) in inspector.invariants" :key="i" class="event ng">{{ v }}</div>
      <div class="heading_s">マスタ警告</div>
      <div v-if="!inspector.masterWarnings.length" class="hint">なし</div>
      <div v-for="(w, i) in inspector.masterWarnings" :key="i" class="event" :class="{ ng: w.level === 'error' }">
        [{{ w.table }}{{ w.id != null ? `#${w.id}` : "" }}] {{ w.message }}
      </div>
    </div>

    <div v-else class="body">
      <div class="heading_s">操作</div>
      <div class="grid">
        <button class="btn sub small" @click="copy">state をコピー</button>
        <button class="btn sub small" @click="paste">貼り付けて差し替え</button>
        <button class="btn sub small" @click="dbg('debug.reseed', {})">乱数リシード</button>
        <button class="btn sub small" @click="dbg('debug.addCoin', { amount: 10 })">コイン +10</button>
        <button class="btn sub small" @click="dbg('debug.addJewel', { amount: 10 })">ジュエル +10</button>
        <button class="btn sub small" @click="dbg('debug.healFull', {})">全回復</button>
        <button class="btn sub small" @click="dbg('debug.winBattle', {})">戦闘即勝利</button>
        <button class="btn sub small" @click="dbg('debug.clearChapter', {})">章クリア</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'poison', value: 3 })">毒 3</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'sleep', value: 1 })">眠り 1</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'ds_crystal', value: 2 })">結晶化 2</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'ds_fever', value: 2 })">体温上昇 2</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'evade', value: 1 })">回避 1</button>
        <button class="btn sub small" @click="dbg('debug.applyStatus', { key: 'focus', value: 1 })">好調 1</button>
        <button class="btn sub small" @click="dbg('debug.crossBreak', {})">クロスブレイク</button>
      </div>
      <div class="heading_s">ハッシュ直行</div>
      <div class="hint">#title #menu #ingame #battle #badbattle #intermission #result #starclear #autotest</div>
      <pre v-if="dbgResult" class="code">{{ dbgResult }}</pre>
    </div>
  </div>
</template>

<script setup>
// state インスペクタ (08)。app/inspector に閉じ、__IS_PROD__ で丸ごと落ちる (GameWindow が出さない)
import { computed, ref } from "vue";
import { useRunStore } from "../stores/run.js";
import { useInspectorStore } from "../stores/inspector.js";
import { q, resolvedOrder, DERIVED_NAMES, PERMISSION_NAMES, STEP_NAMES } from "@core/queries/index.js";
import { deserialize } from "@core/run.js";
import JsonTree from "./JsonTree.vue";

const run = useRunStore();
const inspector = useInspectorStore();
const tabs = ["state", "command", "derive", "order", "check", "ops"];
const changedSet = computed(() => new Set(inspector.changedPaths));

// 引数なしで計算できる派生値だけ
const derivable = DERIVED_NAMES.filter((n) => !["enemyAttack", "enemyMaxHp", "panelCost", "killReward", "statusValue"].includes(n));
const derivedName = ref("attackPower");
const breakdownText = computed(() => {
  if (!run.state) return "";
  try {
    const r = q(run.state).breakdown(derivedName.value);
    return (
      `${derivedName.value} = ${JSON.stringify(r.value)}\n` +
      r.breakdown
        .map(
          (b) =>
            `  ${b.stage.padEnd(6)} ${String(b.label).padEnd(24)} ${JSON.stringify(b.value)}${b.src ? `  (${b.src.family}.${b.src.key}${b.src.uid ? ` #${b.src.uid}` : ""})` : ""}`,
        )
        .join("\n")
    );
  } catch (e) {
    return String(e.message);
  }
});
const permissions = computed(() => {
  if (!run.state) return [];
  const qq = q(run.state);
  return PERMISSION_NAMES.filter((n) => ["canAct", "canFlee", "canRepairCostume"].includes(n)).map((n) => ({ name: n, ...qq.permission(n) }));
});

const stepName = ref("player.strike.after");
const order = computed(() => (run.state ? resolvedOrder(run.state, stepName.value) : []));

const dbgResult = ref("");
function dbg(name, args) {
  const r = run.dispatch(name, args);
  dbgResult.value = `${name} → ${JSON.stringify(r)}`;
}
async function copy() {
  await navigator.clipboard.writeText(JSON.stringify(run.state, null, 2));
  dbgResult.value = "コピーした";
}
async function paste() {
  const text = await navigator.clipboard.readText();
  const state = deserialize(text);
  if (!state) {
    dbgResult.value = "state として読めない";
    return;
  }
  run.setState(state);
  dbgResult.value = "差し替えた";
}
</script>

<style lang="scss" scoped>
.inspector {
  background: rgba(20, 17, 16, 0.96);
  border-left: 1px solid var(--color-base1);
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-mini);
  color: var(--color-white2);
  .tabs {
    display: flex;
    gap: 2px;
    padding: 6px;
    border-bottom: 1px solid var(--color-base2);
    align-items: center;
    .tab {
      padding: 2px 8px;
      border-radius: var(--radius-card);
      color: var(--color-white3);
      &.on {
        background: var(--color-base3);
        color: var(--color-main1);
      }
    }
    .badge {
      margin-left: auto;
      padding: 1px 8px;
      border-radius: var(--radius-round);
      background: var(--color-accent5);
      &.warn {
        background: var(--color-main5);
        color: var(--color-base5);
      }
      &.err {
        background: var(--color-negative3);
      }
    }
  }
  .body {
    flex: 1;
    overflow: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .heading_s {
    color: var(--color-main1);
    margin-top: 6px;
  }
  .code {
    white-space: pre-wrap;
    word-break: break-all;
    background: var(--color-base5);
    padding: 6px;
    border-radius: var(--radius-card);
    font-family: Consolas, monospace;
  }
  .event,
  .hist {
    line-height: 1.3;
    word-break: break-all;
    &.ng {
      color: var(--color-negative1);
    }
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
  select {
    background: var(--color-base4);
    color: var(--color-white);
    border: 1px solid var(--color-base1);
    padding: 2px;
  }
}
</style>
