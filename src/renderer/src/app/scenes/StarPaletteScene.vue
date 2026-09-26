<template>
  <div class="star_scene scene">
    <div class="star_bg_base"></div>
    <div class="star_nebula blue"></div>
    <div class="star_nebula pink"></div>
    <!-- 中層: 立ち絵の輪郭の星座 (tools/star_outline.py → assets/star/outlines.json) -->
    <div class="star_bg_const" :style="{ transform: `translateY(${-scrollTop * 0.35}px)` }">
      <div v-if="outline" class="star_const_wrap" :style="{ left: `${CONST_LEFT}px`, top: `${CONST_TOP}px` }">
        <svg class="star_const" viewBox="0 0 800 1200">
          <g class="star_const_lines"><path v-for="(d, i) in outline.paths" :key="i" :d="d" /></g>
          <g class="star_const_stars">
            <g v-for="([x, y], i) in outline.stars" :key="i">
              <path :d="`M${x - 6} ${y} H${x + 6} M${x} ${y - 6} V${y + 6}`" />
              <circle :cx="x" :cy="y" r="1.6" />
            </g>
          </g>
        </svg>
      </div>
    </div>
    <!-- 中層 2: 瞬く星 -->
    <svg class="star_bg_twinkle" :width="1280" :height="GRAPH_H" :style="{ transform: `translateY(${-scrollTop * 0.6}px)` }">
      <g v-for="s in twinkles" :key="s.id" class="twinkle" :style="{ '--a': s.a, animationDelay: `${s.d}s`, transformOrigin: `${s.x}px ${s.y}px` }">
        <path :d="`M${s.x - s.r} ${s.y} H${s.x + s.r} M${s.x} ${s.y - s.r} V${s.x + s.r > 0 ? s.y + s.r : s.y}`" />
        <circle :cx="s.x" :cy="s.y" r="1.2" />
      </g>
    </svg>

    <!-- 前層: グラフ (縦スクロール) -->
    <div ref="scroll" class="star_scroll no_scrollbar" @scroll="onScroll">
      <div v-hover-se class="star_graph" :style="{ height: `${GRAPH_H}px` }">
        <svg class="star_edges" :width="1280" :height="GRAPH_H">
          <line v-for="e in edges" :key="e.key" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" :class="e.cls" />
        </svg>
        <div
          v-for="n in nodesView"
          :key="n.id"
          class="star_node"
          :class="[`kind_${n.kind}`, n.state, { down: n.delta < 0, selected: selectedId === n.id }]"
          :style="{ left: `${n.px}px`, top: `${n.py}px` }"
          :data-tips="n.kind === 'gate' ? 'starGate' : 'star'"
          @click="clickNode(n)"
        >
          <svg class="star_base" viewBox="0 0 64 64"><path :d="starBasePath(n.kind)" /></svg>
          <Shape class="star_icon" :kind="starShapeOf(n)" :text="null" size="small" />
          <div v-if="n.kind === 'node'" class="star_delta" :class="deltaClass(n.delta)">{{ signedDelta(n.delta) }}</div>
        </div>
      </div>
    </div>

    <!-- 上: タイトルとチップ -->
    <div class="star_top">
      <Ornament kind="head" variant="page" :title="T('star.heading')" />
      <div class="star_subtitle">{{ character.name }}</div>
      <div v-hover-se class="star_chips">
        <span class="star_chip star_sum"
          >{{ T("star.delta") }} <b :class="deltaClass(delta)">{{ signedDelta(delta) }}</b></span
        >
        <span class="star_chip">{{ T("star.active", { n: activeIds.length }) }}</span>
        <div class="star_presets">
          <button
            v-for="d in ['easy', 'normal', 'hard']"
            :key="d"
            class="btn sub mini"
            :class="{ on: progress.star.lastPreset === d }"
            @click="preset(d)"
          >
            {{ T(`star.preset.${d}`) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 右: 詳細 -->
    <div v-hover-se class="star_detail panel_glass orn_frame">
      <div v-if="!selected" class="star_detail_empty">
        <Shape kind="wings" :text="null" />
        <div>{{ T("star.detailEmpty") }}</div>
      </div>
      <template v-else>
        <div class="star_detail_head">
          <div class="star_detail_icon" :class="[`kind_${selected.kind}`, { down: selected.delta < 0 }]">
            <svg class="star_base" viewBox="0 0 64 64"><path :d="starBasePath(selected.kind)" /></svg>
            <Shape class="star_icon" :kind="starShapeOf(selected)" :text="null" size="small" />
          </div>
          <div>
            <div class="star_detail_title">{{ selected.name }}</div>
            <div class="star_detail_kind">{{ T(`star.kind.${selected.kind}`) }}</div>
          </div>
        </div>
        <Ornament kind="rule" />
        <div class="star_detail_body">{{ selected.description }}</div>
        <div v-if="selected.kind === 'node'" class="star_detail_row">
          {{ T("star.delta") }} <b :class="deltaClass(selected.delta)">{{ signedDelta(selected.delta) }}</b>
        </div>
        <div v-if="selected.kind === 'gate'" class="star_detail_row gate" :class="{ met: gateOpen(selected, progress) }">
          <b>{{ gateText(selected) }}</b
          ><i>{{ gateOpen(selected, progress) ? T("star.gate.open") : T("star.gate.closed") }}</i>
        </div>
        <div v-if="selectedRef" class="star_detail_ref" :data-desc="selectedRef.desc">
          <img class="icon_img" :src="selectedRef.icon" alt="" />{{ selectedRef.name }}<i>{{ T("detail.rightClick") }}</i>
        </div>
        <div class="star_detail_state" :class="`st_${selectedState}`">{{ T(`star.state.${selectedState}`) }}</div>
        <div v-if="selected.kind === 'node'" class="star_detail_btn">
          <button class="btn" :class="{ sub: selectedState === 'active' }" :disabled="selectedState === 'locked'" @click="toggle(selected)">
            {{ selectedState === "active" ? T("star.turnOff") : T("star.turnOn") }}
          </button>
        </div>
      </template>
    </div>

    <button class="btn sub mini star_reset_btn" @click="resetAll">{{ T("star.reset") }}</button>
    <button class="btn sub small back_btn" @click="back">{{ T("common.back") }}</button>
  </div>
</template>

<script setup>
// スターパレット (07): 3 層パララックス (星雲 / 星座 + 瞬き / グラフ)、原点からの道を一斉有効化、ゲート、右の詳細、難易度プリセット、全部オフ。
// ロジックは core/star/palette.js。進行データは session.setActiveNodeIds
import { computed, onMounted, ref } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { nodesOf, normalize, toggleNode, deltaOf as starDelta, gateOpen, applyPreset } from "@core/star/palette.js";
import { useSessionStore } from "../stores/session.js";
import { starShapeOf, starBasePath, deltaClass, signedDelta } from "../ui/star_view.js";
import { iconPath } from "../ui/entity_view.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

// マスタの座標 (x -300..300 / y -480..240) を縦に詰めて 720px に収める。はみ出す分は縦スクロール
const GRAPH_H = 720;
const SCALE_Y = 0.78;
const ORIGIN = { x: 560, y: 450 };
const CONST_LEFT = 520;
const CONST_TOP = -60;

const session = useSessionStore();
const characterId = computed(() => session.sceneParams.characterId);
const character = computed(() => master.get("characters", characterId.value));
const progress = computed(() => session.characterProgress(characterId.value));
const nodes = computed(() => nodesOf(characterId.value));
const activeIds = computed(() => normalize(characterId.value, progress.value.star.activeNodeIds, progress.value));
const activeSet = computed(() => new Set(activeIds.value));
const delta = computed(() => starDelta(characterId.value, activeIds.value));
const selectedId = ref(null);
const selected = computed(() => nodes.value.find((n) => n.id === selectedId.value) ?? null);
const scroll = ref(null);
const scrollTop = ref(0);
const outline = ref(null);

// 「有効にできる」= いま有効な地点から道が伸びている (toggleNode が変化を起こす)
function stateOf(n) {
  if (n.kind === "origin") return "active";
  if (n.kind === "gate") return gateOpen(n, progress.value) ? "active" : "locked";
  if (activeSet.value.has(n.id)) return "active";
  const next = toggleNode(characterId.value, activeIds.value, n.id, progress.value);
  return next.includes(n.id) ? "avail" : "locked";
}
const nodesView = computed(() => nodes.value.map((n) => ({ ...n, px: ORIGIN.x + n.x, py: Math.round(ORIGIN.y + n.y * SCALE_Y), state: stateOf(n) })));
const byId = computed(() => new Map(nodesView.value.map((n) => [n.id, n])));
const edges = computed(() => {
  const out = [];
  for (const n of nodesView.value) {
    for (const f of n.fromIds || []) {
      const from = byId.value.get(f);
      if (!from) continue;
      const onA = from.state === "active",
        onB = n.state === "active";
      const cls = [onA && onB ? "on" : onA || onB ? "half" : "", n.delta < 0 || from.delta < 0 ? "down" : ""].join(" ");
      out.push({ key: `${f}-${n.id}`, x1: from.px, y1: from.py, x2: n.px, y2: n.py, cls });
    }
  }
  return out;
});
const selectedState = computed(() => (selected.value ? stateOf(selected.value) : "locked"));
const selectedRef = computed(() => {
  const n = selected.value;
  if (!n || !n.effectType) return null;
  const v = n.values || [];
  const table = {
    startRelic: "relic",
    startEquipment: "equipment",
    startItem: "item",
    startAbility: "ability",
    chapterEnemy: "enemy",
    misfortuneCandidate: "event",
  }[n.effectType];
  if (!table) return null;
  const def = defOf(table, v[0]);
  return { desc: `${table}:${v[0]}`, icon: iconPath(def.icon), name: def.name };
});
function gateText(n) {
  return T(`gate.${n.gateType}`, { n: n.gateValue ?? "" });
}

// 瞬く星 (決定的な擬似乱数で配置)
const twinkles = (() => {
  let s = 12345;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return [...Array(90).keys()].map((id) => ({
    id,
    x: Math.round(rnd() * 1280),
    y: Math.round(rnd() * GRAPH_H),
    r: 2 + Math.round(rnd() * 4),
    a: (0.3 + rnd() * 0.6).toFixed(2),
    d: (-rnd() * 4).toFixed(2),
  }));
})();

function onScroll() {
  scrollTop.value = scroll.value?.scrollTop ?? 0;
}
function clickNode(n) {
  SoundManager.playSe("select");
  selectedId.value = n.id;
}
async function toggle(n) {
  const next = toggleNode(characterId.value, activeIds.value, n.id, progress.value);
  if (next.length === activeIds.value.length && next.every((id, i) => id === activeIds.value[i])) {
    SoundManager.playSe("ng");
    return;
  }
  SoundManager.playSe(next.includes(n.id) ? "equip" : "unequip");
  await session.setActiveNodeIds(characterId.value, next, null);
}
async function preset(d) {
  const yes = await session.openDialog("confirm", { text: T("star.presetConfirm", { name: T(`star.preset.${d}`) }) });
  if (!yes) return;
  await session.setActiveNodeIds(characterId.value, applyPreset(characterId.value, d, progress.value), d);
  SoundManager.playSe("achievement");
}
async function resetAll() {
  const yes = await session.openDialog("confirm", { text: T("star.resetConfirm") });
  if (!yes) return;
  await session.setActiveNodeIds(characterId.value, [], null);
  SoundManager.playSe("unequip");
}
function back() {
  SoundManager.playSe("cancel");
  session.setScene(session.sceneParams.back || "menu", { characterId: characterId.value });
}
onMounted(async () => {
  session.setBgm("title");
  onScroll();
  try {
    const res = await fetch("assets/star/outlines.json");
    if (res.ok) {
      const all = await res.json();
      outline.value = all[String(characterId.value)] ?? null;
    }
  } catch (e) {
    console.warn("assets/star/outlines.json が読めない", e);
  }
});
</script>

<style lang="scss" scoped>
.star_scene {
  overflow: hidden;
  background: #0c0f1c;
  .star_bg_base {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #0c0f1c 0%, #131424 50%, #1a1420 100%);
  }
  .star_nebula {
    position: absolute;
    inset: 0;
    pointer-events: none;
    animation: star_breathe ease-in-out infinite;
    &.blue {
      background: radial-gradient(ellipse 70% 55% at 62% 40%, rgba(68, 97, 141, 0.34), transparent 70%);
      animation-duration: 19s;
    }
    &.pink {
      background: radial-gradient(ellipse 50% 40% at 20% 85%, rgba(110, 32, 49, 0.28), transparent 70%);
      animation-duration: 27s;
      animation-delay: -9s;
    }
  }
  .star_bg_const {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    pointer-events: none;
    .star_const_wrap {
      position: absolute;
      width: 800px;
      height: 1200px;
      opacity: 0.72;
      filter: drop-shadow(0 0 5px rgba(160, 190, 255, 0.6));
    }
    .star_const {
      display: block;
      width: 800px;
      height: 1200px;
      overflow: visible;
    }
    .star_const_lines path {
      fill: none;
      stroke: rgba(250, 249, 246, 0.9);
      stroke-width: 1px;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .star_const_stars path {
      fill: none;
      stroke: #fffaf0;
      stroke-width: 1px;
      stroke-linecap: round;
    }
    .star_const_stars circle {
      fill: #fff;
    }
  }
  .star_bg_twinkle {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    opacity: 0.85;
    overflow: visible;
    .twinkle {
      animation: star_twinkle 4s ease-in-out infinite;
      path {
        fill: none;
        stroke: #faf9f6;
        stroke-width: 1;
        stroke-linecap: round;
      }
      circle {
        fill: #fff;
      }
    }
  }
  .star_scroll {
    position: absolute;
    inset: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .star_graph {
    position: relative;
    width: 1280px;
  }
  .star_edges {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
    line {
      stroke: rgba(230, 227, 222, 0.16);
      stroke-width: 2;
      &.half {
        stroke: rgba(238, 200, 129, 0.45);
        stroke-dasharray: 6 5;
        &.down {
          stroke: rgba(255, 138, 164, 0.45);
        }
      }
      &.on {
        stroke: var(--color-main2);
        stroke-width: 3;
        filter: drop-shadow(0 0 4px rgba(238, 200, 129, 0.8));
        &.down {
          stroke: var(--color-negative1);
          filter: drop-shadow(0 0 4px rgba(255, 138, 164, 0.8));
        }
      }
    }
  }
  .star_node {
    position: absolute;
    width: 64px;
    height: 64px;
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition:
      transform 0.12s ease,
      filter 0.12s ease;
    &.kind_origin {
      width: 84px;
      height: 84px;
    }
    .star_base {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      fill: var(--color-base4);
      stroke: var(--color-white3);
      stroke-width: 2;
      transition:
        fill 0.15s ease,
        stroke 0.15s ease;
    }
    .star_icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.55;
    }
    .star_delta {
      position: absolute;
      left: 50%;
      top: 100%;
      transform: translate(-50%, -6px);
      font-size: var(--font-size-mini);
      color: var(--color-white3);
      &.neg {
        color: var(--color-negative1);
      }
      &.pos {
        color: var(--color-accent3);
      }
    }
    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }
    &.active {
      .star_base {
        fill: var(--color-base3);
        stroke: var(--color-main2);
        filter: drop-shadow(0 0 8px rgba(238, 200, 129, 0.7));
      }
      .star_icon {
        opacity: 1;
      }
      &.down .star_base {
        stroke: var(--color-negative1);
        filter: drop-shadow(0 0 8px rgba(255, 138, 164, 0.7));
      }
    }
    &.kind_origin .star_base,
    &.kind_gate.active .star_base {
      stroke: var(--color-white0);
    }
    &.avail .star_base {
      stroke: var(--color-white2);
      stroke-dasharray: 4 3;
    }
    &.locked {
      filter: brightness(0.6);
    }
    &.selected .star_base {
      stroke-width: 4;
    }
  }
  .star_top {
    position: absolute;
    left: 0;
    right: 320px;
    top: 22px;
    pointer-events: none;
    text-align: center;
    :deep(.orn_head) {
      max-width: 640px;
      margin: 0 auto;
    }
    .star_subtitle {
      margin-top: -2px;
      color: var(--color-white3);
      font-size: var(--font-size-mini);
      letter-spacing: 0.45em;
      text-indent: 0.45em;
    }
    .star_chips {
      position: absolute;
      left: 24px;
      top: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      pointer-events: auto;
    }
    .star_presets {
      display: flex;
      gap: 4px;
      .btn.on {
        background: linear-gradient(180deg, var(--color-main1), var(--color-main3));
        color: var(--color-base5);
      }
    }
  }
  .star_chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: var(--radius-round);
    background: rgba(10, 10, 16, 0.7);
    border: 1px solid var(--color-base1);
    font-size: var(--font-size-small);
    color: var(--color-white2);
    b {
      font-size: var(--font-size-medium);
      color: var(--color-main1);
      min-width: 40px;
      text-align: right;
      font-weight: normal;
      &.neg {
        color: var(--color-negative1);
      }
      &.pos {
        color: var(--color-accent3);
      }
    }
    &.star_sum b {
      font-size: var(--font-size-large);
    }
  }
  .star_detail {
    position: absolute;
    right: 16px;
    top: 96px;
    bottom: 16px;
    width: 300px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    .star_detail_empty {
      margin: auto;
      text-align: center;
      color: var(--color-white3);
      line-height: 1.8;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0.7;
    }
    .star_detail_head {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .star_detail_icon {
      position: relative;
      width: 64px;
      height: 64px;
      flex: none;
      .star_base {
        width: 100%;
        height: 100%;
        fill: var(--color-base3);
        stroke: var(--color-main2);
        stroke-width: 2.5;
      }
      &.down .star_base {
        stroke: var(--color-negative1);
      }
      &.kind_origin .star_base,
      &.kind_gate .star_base {
        stroke: var(--color-white0);
      }
      .star_icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .star_detail_title {
      color: var(--color-main1);
      font-size: var(--font-size-medium);
      line-height: 1.3;
    }
    .star_detail_kind {
      color: var(--color-white3);
      font-size: var(--font-size-mini);
      margin-top: 2px;
    }
    .star_detail_body {
      margin-top: 10px;
      line-height: 1.7;
      color: var(--color-white2);
      font-size: var(--font-size-small);
    }
    .star_detail_row {
      margin-top: 12px;
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
      font-size: var(--font-size-small);
      color: var(--color-white3);
      b {
        font-size: var(--font-size-medium);
        color: var(--color-main1);
        font-weight: normal;
        &.neg {
          color: var(--color-negative1);
        }
        &.pos {
          color: var(--color-accent3);
        }
      }
      &.gate {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        b {
          font-size: var(--font-size-small);
          color: var(--color-white);
          line-height: 1.5;
        }
        i {
          font-style: normal;
          color: var(--color-negative1);
          font-size: var(--font-size-mini);
        }
        &.met i {
          color: var(--color-accent3);
        }
      }
    }
    .star_detail_ref {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: var(--radius-card);
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--color-base3);
      font-size: var(--font-size-small);
      cursor: context-menu;
      img {
        width: 28px;
        height: 28px;
      }
      i {
        margin-left: auto;
        font-style: normal;
        color: var(--color-white3);
        font-size: var(--font-size-mini);
      }
    }
    .star_detail_state {
      margin-top: auto;
      padding-top: 14px;
      text-align: center;
      color: var(--color-white3);
      font-size: var(--font-size-small);
      &.st_active {
        color: var(--color-main1);
      }
      &.st_avail {
        color: var(--color-accent3);
      }
    }
    .star_detail_btn {
      margin-top: 10px;
      .btn {
        width: 100%;
      }
    }
  }
  .star_reset_btn {
    position: absolute;
    right: 336px;
    bottom: 60px;
    opacity: 0.6;
    &:hover {
      opacity: 1;
    }
  }
}
@keyframes star_breathe {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
@keyframes star_twinkle {
  0%,
  100% {
    opacity: calc(var(--a, 0.6) * 0.2);
    transform: scale(0.7);
  }
  50% {
    opacity: var(--a, 0.6);
    transform: scale(1.15);
  }
}
</style>
