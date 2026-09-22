// 自動プレイヤー (08)。queries だけを見て手を選ぶ (UI と同じ情報しか使わない)。
// select で手を選び、それ以外のステップは advance を回す。判断用の乱数はゲームの rng とは別ストリーム
import { dispatch } from "../../src/renderer/src/core/commands/index.js";
import { phaseOf, q, panelAt, availableCommands } from "../../src/renderer/src/core/queries/index.js";
import { isAdvanceable } from "../../src/renderer/src/core/timeline/steps.js";
import { master } from "../../src/renderer/src/core/master/index.js";

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function must(state, name, args, onCommand) {
  const r = dispatch(state, name, args);
  onCommand?.(name, args, r);
  if (!r.ok)
    throw new Error(`ボットの手 ${name}(${JSON.stringify(args)}) が拒否された: ${r.reason} (phase=${phaseOf(state)}, step=${state.battle?.step})`);
  return r;
}

// 1 手打つ。戻り値: 打ったコマンド名 (終了なら null)
export function botStep(state, { rng, playProb = 0.85, onCommand = null } = {}) {
  const phase = phaseOf(state);
  if (phase === "ended") return null;

  if (phase === "pending") {
    must(state, "resolvePending", { index: 0, discard: true }, onCommand);
    return "resolvePending";
  }

  if (phase === "battle") {
    const b = state.battle;
    if (isAdvanceable(b.step)) {
      must(state, "advance", {}, onCommand);
      return "advance";
    }
    if (b.step === "battle.end") {
      must(state, "closeBattle", {}, onCommand);
      return "closeBattle";
    }
    // select
    const qq = q(state);
    const inv = state.inventory.entities;
    // 武器 / 防具を ON にする (許可されるものだけ)
    for (const e of inv) {
      if (e.kind === "equipment" && !e.active && rng() < 0.7 && qq.canActivateEquipment(e).ok) must(state, "toggleEquip", { uid: e.uid }, onCommand);
    }
    // 回復アイテム (hp が半分以下)
    const maxHp = qq.derive("maxHp");
    for (const e of inv) {
      if (e.kind === "item" && state.player.hp <= maxHp / 2 && qq.canUseItem(e).ok) {
        if (master.get("items", e.defId).type === "instantHeal") must(state, "useItem", { uid: e.uid }, onCommand);
      }
    }
    if (phaseOf(state) !== "battle" || state.battle.step !== "select") return "useItem";
    for (const e of inv) {
      if (e.kind === "ability" && rng() < 0.6 && qq.canUseAbility(e).ok) {
        must(state, "useAbility", { uid: e.uid }, onCommand);
        if (state.battle.step !== "select") return "useAbility";
      }
    }
    if (!b.started && state.player.hp <= 3 && rng() < 0.5) {
      must(state, "cancelBattle", {}, onCommand);
      return "cancelBattle";
    }
    if (b.started && state.player.hp <= 2 && rng() < 0.3) {
      must(state, "flee", {}, onCommand);
      return "flee";
    }
    must(state, "attack", {}, onCommand);
    return "attack";
  }

  if (phase === "intermission") {
    const qq = q(state);
    while (state.player.hp < qq.derive("maxHp") && state.wallet.jewel >= qq.derive("healPrice") && rng() < 0.9) must(state, "buyHeal", {}, onCommand);
    for (let i = 0; i < state.shop.slots.length; i++) {
      const slot = state.shop.slots[i];
      if (slot.soldOut || rng() > 0.5) continue;
      const r = dispatch(state, "buyShopSlot", { index: i });
      onCommand?.("buyShopSlot", { index: i }, r);
    }
    must(state, "enterNextChapter", {}, onCommand);
    return "enterNextChapter";
  }

  // chapter
  const cells = [];
  for (let c = 0; c < state.board.width; c++) if (panelAt(state, c)) cells.push(c);
  if (cells.length === 0) throw new Error("盤面に選べるパネルが無い (進行不能)");
  const clearCell = cells.find((c) => panelAt(state, c).kind === "chapterClear");
  if (clearCell != null && rng() < 0.7) {
    must(state, "takeChapterClear", { cell: clearCell }, onCommand);
    return "takeChapterClear";
  }
  const cell = cells[Math.floor(rng() * cells.length)];
  const panel = panelAt(state, cell);
  switch (panel.kind) {
    case "enemy":
      must(state, "startBattle", { cell }, onCommand);
      return "startBattle";
    case "chapterClear":
      must(state, "takeChapterClear", { cell }, onCommand);
      return "takeChapterClear";
    case "event": {
      const ev = master.get("events", panel.defId);
      must(state, "chooseEvent", { cell, choiceIndex: Math.floor(rng() * ev.choiceIds.length) }, onCommand);
      return "chooseEvent";
    }
    default: {
      const r = dispatch(state, "takePanel", { cell });
      onCommand?.("takePanel", { cell }, r);
      if (r.ok) return "takePanel";
      must(state, "dumpPanel", { cell }, onCommand);
      return "dumpPanel";
    }
  }
}

// 勝敗まで自動で回す。戻り値: { ended, ending, steps, wedged }
export function autoPlay(state, { seed = 1, maxSteps = 5000, playProb = 0.85, onCommand = null } = {}) {
  const rng = mulberry32(seed);
  let steps = 0;
  let lastSig = null;
  let stall = 0;
  while (phaseOf(state) !== "ended" && steps < maxSteps) {
    const cmd = botStep(state, { rng, playProb, onCommand });
    if (cmd == null) break;
    steps += 1;
    const sig = `${phaseOf(state)}#${state.battle?.step}#${state.player.hp}#${state.battle?.turn}#${state.progress.chapterIndex}#${state.board.deck.length}#${state.board.cells.join(",")}`;
    if (sig === lastSig) {
      stall += 1;
      if (stall > 60) return { ended: false, ending: null, steps, wedged: true, reason: `状態が ${stall} 手変わらない (${cmd})` };
    } else {
      stall = 0;
      lastSig = sig;
    }
  }
  const ended = phaseOf(state) === "ended";
  return { ended, ending: state.progress.ending, steps, wedged: !ended && steps >= maxSteps, reason: ended ? null : "maxSteps" };
}
