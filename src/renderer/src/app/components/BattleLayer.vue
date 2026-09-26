<template>
  <div v-if="battle" class="battle_layer" :class="{ closing }">
    <!-- 左の裏パネル: にげる / やめておく -->
    <div v-if="battle.step !== 'battle.end'" v-hover-se class="flee_panel panel_glass">
      <button v-if="!battle.started" class="btn sub" @click="cmd('cancelBattle')">{{ T("common.letItBe") }}</button>
      <button v-else class="btn sub flee_btn" :class="{ locked: !canFlee.ok }" data-tips="flee" @click="cmd('flee')">
        {{ T("battle.flee") }}
        <span v-if="!canFlee.ok" class="flee_overlay" :class="fleeOverlay"><Shape kind="crystal" :text="null" size="small" /></span>
      </button>
    </div>
    <!-- 右の行動メモ -->
    <div v-if="panel" class="memo_panel panel_glass" :data-desc="`enemy:${panel.defId}`" data-desc-ref="battle">
      <div class="memo_head">{{ T("battle.memoHeading", { name: enemyDef.name }) }}</div>
      <div class="memo_list" :style="{ zoom: routines.length > 4 ? 4 / routines.length : '' }">
        <div v-for="(r, i) in routines" :key="r.id" class="memo_row" :class="{ current: i === currentIndex }" :title="r.name">
          <span class="shapes">
            <Shape v-for="(s, j) in routineShapes(r)" :key="j" :kind="s.shape" :text="s.text" size="small" />
          </span>
          <span class="cursor">{{ i === currentIndex ? "◀" : "" }}</span>
        </div>
      </div>
    </div>
    <!-- 下から生えてくる戦闘パネル -->
    <div v-hover-se class="battle_panel panel_glass" :class="{ shake: shaking }" data-tips="battle">
      <div class="battle_bg">
        <div class="bg_img" :style="{ backgroundImage: `url(assets/backgrounds/${chapter.battleBg}.png)` }"></div>
        <div class="bg_grad"></div>
      </div>
      <div class="battle_top">
        <div class="side player">
          <div class="hp_line">
            <span class="hp_num">{{ state.player.hp }}</span
            ><span class="hint">/ {{ maxHp }}</span>
          </div>
          <HpDots :hp="state.player.hp" :max="maxHp" variant="ticks" />
          <div class="act_line">
            <Shape kind="attack" :text="attackPower" :title="T('common.attack')" />
            <Shape v-if="blockValue > 0" kind="block" :text="blockValue" :title="T('common.block')" />
            <Shape v-if="lethalThreshold > 0" kind="lethal" :text="lethalThreshold" :title="T('battle.lethalChip', { n: lethalThreshold })" />
            <StatusChips
              :statuses="state.player.statuses"
              :unique="state.player.unique"
              :costume="state.player.costume"
              :buffs="battle.buffs"
              :shield="battle.shield"
              size="small"
              reverse
            />
          </div>
        </div>
        <div class="sep"></div>
        <div v-if="panel" class="side enemy" :data-desc="`enemy:${panel.defId}`" data-desc-ref="battle">
          <div class="hp_line">
            <span class="hp_num">{{ Math.max(0, enemy.hp) }}</span
            ><span class="hint">/ {{ enemyMaxHp }}</span
            ><span class="enemy_name">{{ enemyDef.name }}</span>
          </div>
          <HpDots :hp="Math.max(0, enemy.hp)" :max="enemyMaxHp" variant="enemy_ticks" />
          <div class="act_line">
            <template v-if="enemy.stunned"><Shape kind="rest" text="×" :title="T('battle.stunnedChip')" /></template>
            <template v-else><Shape v-for="(s, j) in nextShapes" :key="j" :kind="s.shape" :text="s.text" /></template>
            <StatusChips :statuses="enemy.statuses" :buffs="enemy.buffs" :shield="enemy.shield" shield-kind="enemyShield" size="small" />
            <Shape v-if="enemy.block > 0" kind="block" :text="enemy.block" size="small" :title="T('common.block')" />
          </div>
        </div>
      </div>
      <div class="battle_field">
        <svg
          class="battle_floor"
          :viewBox="`0 0 ${floor.width} ${floor.height}`"
          :width="floor.width"
          :height="floor.height"
          :style="{ top: `${floor.top}px` }"
        >
          <defs>
            <linearGradient id="floor_fade_v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#000" />
              <stop offset="0.28" stop-color="#fff" />
              <stop offset="1" stop-color="#666" />
            </linearGradient>
            <linearGradient id="floor_fade_h" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#000" />
              <stop offset="0.18" stop-color="#fff" />
              <stop offset="0.82" stop-color="#fff" />
              <stop offset="1" stop-color="#000" />
            </linearGradient>
            <mask id="floor_mask_v"><rect :width="floor.width" :height="floor.height" fill="url(#floor_fade_v)" /></mask>
            <mask id="floor_mask_h"><rect :width="floor.width" :height="floor.height" fill="url(#floor_fade_h)" /></mask>
          </defs>
          <g mask="url(#floor_mask_v)">
            <g mask="url(#floor_mask_h)" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1">
              <line v-for="(l, i) in floor.lines" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" />
            </g>
          </g>
        </svg>
        <div class="battle_sd">
          <SdPiece :character-id="state.characterId" :player="state.player" :size="300" :float-duration="3.6" :float-delay="-2.1" />
        </div>
        <div v-if="panel" class="enemy_wrap" data-tips="parry">
          <EnemyVisual :def-id="panel.defId" :enemy="enemy" :anim-at="enemyAnim.at" :anim-kind="enemyAnim.kind" />
        </div>
      </div>
      <div class="battle_actions">
        <button class="btn big attack_btn bare" :class="{ zzz: !canAct.ok }" :title="T('common.attack')" :disabled="!isSelect" @click="cmd('attack')">
          <span v-if="!canAct.ok" class="zzz_text">zzz</span>
          <svg v-else class="swords" viewBox="-1 -1 50 50" width="44" height="44" aria-hidden="true" fill="currentColor">
            <g transform="translate(24 24) rotate(-45)">
              <path d="M0 -25 L3.4 -17 L3.4 4 L-3.4 4 L-3.4 -17 Z" />
              <rect x="-9" y="3.5" width="18" height="4" rx="1.5" />
              <rect x="-2.2" y="7.5" width="4.4" height="10" />
              <circle cx="0" cy="19.5" r="3" />
            </g>
            <g transform="translate(24 24) rotate(45)" stroke="#e0bd77" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round">
              <path d="M0 -25 L3.4 -17 L3.4 4 L-3.4 4 L-3.4 -17 Z" />
              <rect x="-9" y="3.5" width="18" height="4" rx="1.5" />
              <rect x="-2.2" y="7.5" width="4.4" height="10" />
              <circle cx="0" cy="19.5" r="3" />
            </g>
          </svg>
        </button>
        <button v-if="battle.step === 'battle.end'" class="btn close_btn" @click="cmd('closeBattle')">{{ T("battle.close") }}</button>
      </div>
      <div :key="toast.at" class="battle_toast" :class="[toast.cls, { show: toast.show }]">{{ toast.text }}</div>
      <div v-for="n in floats" :key="n.id" class="dmg_num" :class="n.cls" :style="{ left: `${n.x}px`, top: `${n.y}px` }">{{ n.text }}</div>
    </div>
  </div>
</template>

<script setup>
// 戦闘レイヤー (tale battle_layer): 左の にげる パネル / 右の行動メモ / 下から生える戦闘パネル。
// state (battle.step / cursor / turnMemo) をそのまま描き、outbox の一発物 (run.lastEvents) で演出 (数字 / トースト / 揺れ) を足す。
// 進行 (advance) は StepMover が打つ
import { computed, reactive, ref, watch, onBeforeUnmount } from "vue";
import { master } from "@core/master/index.js";
import { q, currentChapter, currentRoutine } from "@core/queries/index.js";
import { enemyRoutines } from "@core/domain/board.js";
import { registry } from "@core/effects/index.js";
import { useRunStore } from "../stores/run.js";
import { useTalkStore } from "../stores/talk.js";
import { actionShape } from "../ui/shapes.js";
import { floorGridLines } from "../ui/floor.js";
import { T, reasonText } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import Shape from "./Shape.vue";
import HpDots from "./HpDots.vue";
import StatusChips from "./StatusChips.vue";
import SdPiece from "./SdPiece.vue";
import EnemyVisual from "./EnemyVisual.vue";

const emit = defineEmits(["message"]);
const run = useRunStore();
const talk = useTalkStore();
const state = computed(() => run.state);
const battle = computed(() => run.state.battle);
// 勝利すると battle.victory の boardUpdate でパネルが盤面から消える (ぬしは chapterClear に変わる) が、
// closeBattle までこのレイヤーは残るので、最後に見た敵パネルの写しで描き続ける (02 の不変条件の例外と同じ扱い)
const lastEnemyPanel = ref(null);
watch(
  () => run.state.battle && run.state.board.panels[run.state.battle.panelUid],
  (p) => {
    if (p && p.kind === "enemy") lastEnemyPanel.value = JSON.parse(JSON.stringify(p));
  },
  { immediate: true, deep: true, flush: "sync" },
);
const panel = computed(() => {
  const p = run.state.battle ? run.state.board.panels[run.state.battle.panelUid] : null;
  return p && p.kind === "enemy" ? p : lastEnemyPanel.value;
});
const enemy = computed(() => panel.value?.enemy ?? null);
const enemyDef = computed(() => (panel.value ? master.get("enemies", panel.value.defId) : null));
const chapter = computed(() => currentChapter(run.state));
const qq = computed(() => q(run.state));
const maxHp = computed(() => qq.value.derive("maxHp"));
const enemyMaxHp = computed(() => (panel.value ? qq.value.derive("enemyMaxHp", { defId: panel.value.defId }) : 0));
const attackPower = computed(() => qq.value.derive("attackPower"));
const blockValue = computed(() => qq.value.derive("blockValue"));
const lethalThreshold = computed(() => qq.value.derive("lethalThreshold"));
const canAct = computed(() => qq.value.canAct());
const canFlee = computed(() => qq.value.canFlee());
const fleeOverlay = computed(() => {
  const u = run.state.player.unique;
  if (!u) return "";
  const def = master.byKey("statuses", u.key);
  return registry.find("status", def.effect || def.key)?.text?.fleeOverlay ?? "";
});
const isSelect = computed(() => battle.value.step === "select");
const routines = computed(() => (panel.value ? enemyRoutines(panel.value.defId) : []));
const currentIndex = computed(() => (routines.value.length && enemy.value ? enemy.value.routineIndex % routines.value.length : 0));
const closing = ref(false);
const floor = floorGridLines();

function routineShapes(r) {
  if (!r.actions.length) return [actionShape(null)];
  return r.actions.map((a) => actionShape(a, a.type === "attack" ? qq.value.derive("enemyAttack", { action: a }) : null));
}
const nextShapes = computed(() => routineShapes((panel.value && currentRoutine(panel.value)) || { actions: [] }));

function cmd(name) {
  const r = run.dispatch(name);
  if (!r.ok) {
    SoundManager.playSe("ng");
    emit("message", reasonText(r.reason));
    return;
  }
  if (name === "attack" && !battle.value.started) talk.say(panel.value?.isBoss ? "bossBattleStart" : "battleStart", { hop: true });
  if (name === "cancelBattle") SoundManager.playSe("cancel");
}

// ---- 演出 (一発物 → 数字 / トースト / 揺れ / 敵アニメ) ----
const toast = reactive({ text: "", cls: "", show: false, at: 0 });
const floats = ref([]);
const enemyAnim = reactive({ at: 0, kind: "" });
const shaking = ref(false);
let floatUid = 1;
const PLAYER_ANCHOR = { x: 250, y: 40 };
const ENEMY_ANCHOR = { x: 540, y: 250 };
const SHIELD_ANCHOR = { x: 250, y: 100 };

function showToast(text, cls = "") {
  toast.text = text;
  toast.cls = cls;
  toast.show = false;
  toast.at = Date.now();
  requestAnimationFrame(() => (toast.show = true));
}
function floatNum(anchor, text, cls = "") {
  const id = floatUid++;
  floats.value.push({ id, x: anchor.x + (Math.random() * 20 - 10), y: anchor.y, text, cls });
  setTimeout(() => (floats.value = floats.value.filter((n) => n.id !== id)), 1100);
}
function animEnemy(kind) {
  enemyAnim.kind = kind;
  enemyAnim.at = Date.now();
}
function screenDamage() {
  shaking.value = false;
  requestAnimationFrame(() => (shaking.value = true));
  setTimeout(() => (shaking.value = false), 450);
}

const stop = watch(
  () => run.lastEvents,
  (events) => {
    for (const e of events) {
      const p = e.payload;
      switch (e.type) {
        case "playerStrike":
          animEnemy("hit");
          if (p.dmg > 0) {
            floatNum(ENEMY_ANCHOR, `-${p.dmg}`);
            if (Math.random() < 0.35) talk.say("playerAttack");
          } else {
            floatNum(ENEMY_ANCHOR, p.absorbed > 0 ? T("fx.shieldAbsorb", { n: p.absorbed }) : T("fx.enemyBlocked"), "zero");
            talk.say("attackBlocked");
          }
          break;
        case "enemyDamage":
          if (["item", "ability", "lethal", "poison", "self"].includes(p.tag) && p.dmg > 0) {
            animEnemy("hit");
            floatNum(ENEMY_ANCHOR, `-${p.dmg}`, p.tag === "poison" ? "poison_num" : "");
          }
          break;
        case "enemyShieldAbsorb":
          if (!events.some((x) => x.type === "playerStrike")) floatNum(ENEMY_ANCHOR, T("fx.shieldAbsorb", { n: p.absorbed }), "zero");
          break;
        case "lethalScythe":
          showToast(T("battle.lethal"), "lethal_toast");
          talk.say("lethal", { hop: true });
          break;
        case "justLethal":
          if (p.tag !== "lethal") showToast(T("battle.justLethal"), "parry_toast");
          break;
        case "enemyAttack":
          animEnemy("lunge");
          if (p.passed > 0) screenDamage();
          else floatNum(PLAYER_ANCHOR, T("fx.playerGuard"), "zero");
          break;
        case "enemyAttackNegated":
          showToast(T("battle.evade"), "parry_toast");
          talk.say("evade", { hop: true });
          break;
        case "playerDamage":
          if (p.absorbed > 0) floatNum(SHIELD_ANCHOR, T("fx.shieldAbsorb", { n: p.absorbed }), "zero");
          if (p.hpLoss > 0) floatNum(PLAYER_ANCHOR, `-${p.hpLoss}`, p.tag === "poison" ? "poison_num" : "");
          if (p.tag === "poison") {
            screenDamage();
            talk.say("poisoned");
          }
          break;
        case "enemyBlock":
          floatNum(ENEMY_ANCHOR, T("fx.blockGain", { n: p.value }), "zero");
          break;
        case "enemyShield":
          floatNum(ENEMY_ANCHOR, T("fx.enemyShieldGain", { n: p.value }), "zero");
          break;
        case "enemyRoutineStart":
          showToast((panel.value && currentRoutine(panel.value)?.name) ?? "");
          break;
        case "enemyStunned":
          showToast(T("fx.stunned"));
          break;
        case "parry":
          showToast(T("fx.parry"), "parry_toast");
          talk.say("parry", { hop: true });
          break;
        case "enemyRest":
          showToast(T("fx.enemyRest"));
          break;
        case "enemyPierce":
          showToast(T("battle.actionPierce"));
          break;
        case "blitz":
          showToast(run.state.player.statuses.some((s) => s.key === "sticky") ? T("fx.enemySlow") : T("fx.enemyBlitz"));
          break;
        case "heal":
          if (p.healed > 0) floatNum(PLAYER_ANCHOR, `+${p.healed}`, "heal");
          break;
        case "drainHeal":
          break;
        case "shieldGain":
          floatNum(SHIELD_ANCHOR, T("fx.shieldGain", { n: p.amount }), "zero");
          break;
        case "poisonCured":
          showToast(T("fx.poisonCured"));
          break;
        case "poisonApply":
          floatNum(ENEMY_ANCHOR, T("fx.poisonGainNum", { n: p.value }), "poison_num");
          break;
        case "statusApply":
          if (p.target === "player") {
            showToast(T("fx.statusGain", { name: master.byKey("statuses", p.key).name, n: p.value }), p.polarity === "good" ? "good_toast" : "");
            if (p.polarity === "bad") talk.say(`status.${p.key}`) || talk.say("badStatus");
          }
          break;
        case "uniqueApply":
          showToast(T("fx.statusGain", { name: master.byKey("statuses", p.key).name, n: p.turns }), "bad_toast");
          talk.say(`status.${p.key}`, { hop: true }) || talk.say("badStatus", { hop: true });
          break;
        case "statusSkipped":
          showToast(T("fx.statusSkipped"));
          break;
        case "weaponsForcedOff":
          showToast(T("fx.weaponsForcedOff"));
          break;
        case "confusionDeactivate":
          showToast(T("fx.confusionDeactivate"));
          break;
        case "crossBreak":
          if (p.changed) {
            screenDamage();
            showToast(
              p.to === "full" ? T("fx.crossBreak.full") : p.to === "normal" ? T("fx.crossBreak.normal") : T("fx.crossBreak.half"),
              "bad_toast",
            );
            talk.say("clothBreak", { hop: true });
            talk.setFace(30, 1500);
          } else showToast(T("fx.crossBreak.same"));
          break;
        case "crossBreakIgnored":
          showToast(T("fx.crossBreakIgnored"));
          break;
        case "costumeChange":
          if (p.cause === "item") showToast(T("fx.costumeChange", { name: master.byKey("statuses", p.to).name }));
          break;
        case "sleepSkip":
          showToast(T("fx.sleepSkip"));
          break;
        case "sleepCured":
          showToast(T("fx.sleepCured"));
          break;
        case "itemUse":
          showToast(master.get("items", p.defId).name);
          talk.say("itemUse");
          break;
        case "abilityUse":
          showToast(master.get("abilities", p.defId).name);
          talk.say("itemUse");
          break;
        case "abilityReady":
          showToast(T("fx.abilityReady", { name: master.get("abilities", p.defId).name }));
          break;
        case "equipBreak":
          showToast(T("fx.equipBreak", { name: master.get("equipments", p.defId).name }));
          talk.say("equipBreak");
          break;
        case "itemBreak":
          showToast(T("fx.itemUsedUp", { name: master.get("items", p.defId).name }));
          break;
        case "abilityBreak":
          showToast(T("fx.abilityBreak", { name: master.get("abilities", p.defId).name }));
          break;
        case "relicProc":
          showToast(T("fx.relicProc", { name: master.get("relics", p.defId).name }));
          break;
        case "bookRuleProc":
          showToast(T("fx.bookRuleProc", { name: master.where("bookRules", "key", p.key)[0]?.name ?? p.key }), "good_toast");
          break;
        case "victory":
          showToast(T("fx.victory", { n: p.coin }), "good_toast");
          talk.say(p.isBoss ? "bossVictory" : "victory", { hop: true });
          break;
        case "defeat":
          talk.say("gameOver");
          break;
        case "fleeStart":
          showToast(T("fx.flee"));
          break;
        case "fleeDone":
          talk.say("flee");
          break;
        case "delayedFire":
          showToast(T("fx.delayedFire"));
          break;
        default:
          break;
      }
    }
    if (events.some((e) => e.type === "playerDamage" && e.payload.hpLoss > 0 && e.payload.tag === "enemyAttack")) {
      if (run.state.player.hp <= maxHp.value * 0.3) talk.say("hpDanger");
      else talk.say("playerDamaged");
    }
  },
);
onBeforeUnmount(() => stop());
</script>

<style lang="scss" scoped>
.battle_layer {
  position: absolute;
  inset: 0;
  z-index: 200;
}
@keyframes battle_rise {
  from {
    transform: translateY(110%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes flee_in {
  from {
    transform: rotate(-7deg) translateX(70px);
    opacity: 0;
  }
  to {
    transform: rotate(-7deg) translateX(0);
    opacity: 1;
  }
}
@keyframes memo_in {
  from {
    transform: rotate(6deg) translateX(-60px);
    opacity: 0;
  }
  to {
    transform: rotate(6deg) translateX(0);
    opacity: 1;
  }
}
.flee_panel {
  position: absolute;
  left: 110px;
  top: 430px;
  width: 230px;
  height: 112px;
  padding: 16px 14px;
  z-index: 0;
  transform: rotate(-7deg);
  animation: flee_in 0.24s ease-out 0.3s both;
  .btn {
    width: 112px;
  }
  .flee_btn {
    position: relative;
    &.locked {
      color: var(--color-white3);
    }
    .flee_overlay {
      position: absolute;
      inset: -6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-button);
      background: rgba(206, 223, 248, 0.35);
      backdrop-filter: blur(1px);
      border: 1px solid var(--color-positive1);
    }
  }
}
.memo_panel {
  position: absolute;
  left: 890px;
  top: 350px;
  width: 300px;
  padding: 12px 14px 14px;
  z-index: 0;
  text-align: right;
  transform: rotate(6deg);
  animation: memo_in 0.24s ease-out 0.3s both;
  .memo_head {
    color: var(--color-main1);
    font-size: var(--font-size-small);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .memo_list {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .memo_row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    height: 42px;
    padding: 0 6px;
    border-radius: var(--radius-card);
    color: var(--color-white3);
    &.current {
      background: rgba(255, 228, 178, 0.14);
      color: var(--color-white0);
    }
    .cursor {
      width: 14px;
      flex: none;
      color: var(--color-main1);
      font-size: var(--font-size-mini);
    }
    .shapes {
      display: flex;
      gap: 0;
      flex: none;
    }
  }
}
.battle_panel {
  position: absolute;
  left: 240px;
  top: 124px;
  width: 730px;
  bottom: -30px;
  padding: 0 26px;
  z-index: 1;
  border-bottom: none;
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  background: linear-gradient(160deg, rgba(58, 47, 41, 0.985), rgba(31, 27, 25, 0.99));
  display: flex;
  flex-direction: column;
  animation: battle_rise 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  .battle_bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    z-index: 0;
    .bg_img {
      position: absolute;
      inset: -24px;
      background-size: cover;
      background-position: center;
      filter: blur(2px) brightness(0.85);
    }
    .bg_grad {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(31, 27, 25, 0.97) 0%,
        rgba(31, 27, 25, 0.9) 20%,
        rgba(31, 27, 25, 0.45) 42%,
        rgba(31, 27, 25, 0.2) 70%,
        rgba(31, 27, 25, 0.45) 100%
      );
      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 298px;
        height: 120px;
        background: radial-gradient(ellipse 70% 60% at 50% 55%, rgba(255, 240, 210, 0.16), rgba(255, 240, 210, 0) 70%);
      }
    }
  }
  .battle_top,
  .battle_field,
  .battle_actions {
    position: relative;
    z-index: 1;
  }
  .battle_top {
    z-index: 2;
    display: flex;
    align-items: stretch;
    padding-top: 12px;
    .side {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      &.player {
        align-items: flex-end;
        padding-right: 12px;
        :deep(.hp_dots) {
          direction: rtl;
        }
        .act_line {
          flex-direction: row-reverse;
        }
      }
      &.enemy {
        align-items: flex-start;
        padding-left: 12px;
      }
    }
    .sep {
      width: 1px;
      flex: none;
      background: var(--color-base1);
      margin-top: 4px;
    }
    .hp_line {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .hp_num {
      font-size: var(--font-size-2xlarge);
      color: var(--color-white0);
      line-height: 1;
    }
    .enemy_name {
      color: var(--color-negative1);
      font-size: var(--font-size-small);
      margin-left: 4px;
    }
    .act_line {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
  .battle_field {
    position: relative;
    height: 226px;
    margin-top: 4px;
    flex: none;
  }
  .battle_floor {
    position: absolute;
    left: -26px;
    pointer-events: none;
    z-index: 0;
  }
  .battle_sd {
    position: absolute;
    left: 10px;
    bottom: -16px;
    animation: battle_sd_in 0.26s ease-out 0.22s both;
    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 280px;
      width: 240px;
      height: 36px;
      margin-left: -120px;
      margin-top: -18px;
      border-radius: 50%;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 45%, rgba(0, 0, 0, 0) 72%);
    }
  }
  .enemy_wrap {
    position: absolute;
    right: 60px;
    bottom: 6px;
    width: 210px;
    height: 200px;
    filter: drop-shadow(6px 10px 3px #000);
    animation: battle_enemy_in 0.26s ease-out 0.26s both;
  }
  .battle_actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 0;
    .attack_btn {
      width: 150px;
      padding: 6px 0;
      svg {
        display: block;
      }
      &.zzz {
        filter: saturate(0.3);
      }
      .zzz_text {
        font-size: var(--font-size-large);
        line-height: 44px;
      }
    }
  }
  .battle_toast {
    position: absolute;
    left: 50%;
    top: 42%;
    transform: translate(-50%, -50%) scale(0.9);
    font-size: var(--font-size-xlarge);
    color: var(--color-main1);
    text-shadow:
      0 3px 0 var(--color-base5),
      0 0 24px rgba(0, 0, 0, 0.8);
    opacity: 0;
    z-index: 340;
    pointer-events: none;
    white-space: nowrap;
    &.show {
      animation: toast_anim 1s ease both;
    }
    &.parry_toast,
    &.good_toast {
      color: var(--color-accent2);
      font-size: var(--font-size-2xlarge);
    }
    &.lethal_toast {
      color: var(--color-main0);
      font-size: var(--font-size-2xlarge);
    }
    &.bad_toast {
      color: var(--color-negative1);
    }
  }
  .dmg_num {
    position: absolute;
    z-index: 320;
    font-size: var(--font-size-2xlarge);
    color: var(--color-negative1);
    text-shadow:
      0 2px 0 var(--color-base5),
      0 0 18px rgba(0, 0, 0, 0.6);
    animation: dmg_float 1s ease both;
    pointer-events: none;
    white-space: nowrap;
    &.heal {
      color: var(--color-accent2);
    }
    &.zero {
      color: var(--color-white3);
      font-size: var(--font-size-xlarge);
    }
    &.poison_num {
      font-size: var(--font-size-xlarge);
    }
  }
}
@keyframes battle_sd_in {
  from {
    transform: translateX(-90px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes battle_enemy_in {
  from {
    transform: translateX(90px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes toast_anim {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  35% {
    transform: translate(-50%, -50%) scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -56%) scale(1);
  }
}
@keyframes dmg_float {
  0% {
    transform: translateY(0) scale(0.6);
    opacity: 0;
  }
  15% {
    transform: translateY(-8px) scale(1.25);
    opacity: 1;
  }
  70% {
    transform: translateY(-34px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-56px) scale(1);
    opacity: 0;
  }
}
// 閉じるとき (InGameScene の transition)
.battle_layer.battle-leave-active {
  transition: opacity 0.26s ease-in;
  .battle_panel {
    animation: battle_drop 0.26s ease-in both;
  }
}
.battle_layer.battle-leave-to {
  opacity: 0;
}
@keyframes battle_drop {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(110%);
  }
}
</style>
