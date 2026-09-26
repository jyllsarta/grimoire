// ============================================================
// GameState (02_state) の初期状態と不変条件。
// state はプレーンな JSON。クラス・関数・undefined・循環参照を持たない。
// ============================================================

import { createRng } from "../rng.js";
import { UID_START } from "../uid.js";
import { BATTLE_STEP_NAMES } from "../steps/index.js";
import { master } from "../master/index.js";
import { chapterSequence } from "../domain/chapter.js";
import { derive } from "../derived/index.js";
import { createCtx } from "../ctx.js";
import { entitySize, tableOfKind } from "../domain/entity.js";

export { entitySize, tableOfKind };

export const SCHEMA_VERSION = 2;

export const ENTITY_KINDS = ["equipment", "item", "ability"];
export const PANEL_KINDS = ["enemy", "equipment", "item", "ability", "event", "chapterClear"];
export const ENDINGS = ["normal", "happy", "lose", "abandoned"];

export function createState({ characterId, bookId, seed, star, difficulty = null, appVersion = "dev", edition = "prod", now = null }) {
  const createdAt = now ?? new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { createdAt, updatedAt: createdAt, appVersion, edition, difficulty },
    rng: createRng(seed),
    uidNext: UID_START,
    characterId,
    bookId,
    star: {
      activeNodeIds: [...(star?.activeNodeIds ?? [])],
      delta: star?.delta ?? 0,
      effects: (star?.effects ?? []).map((e) => ({ nodeId: e.nodeId, type: e.type, values: [...e.values] })),
      crownsGained: 0,
    },
    progress: { chapterIndex: 0, stage: "main", ending: null, pending: [] },
    player: { hp: 0, statuses: [], unique: null, costume: "normal" },
    wallet: { coin: 0, jewel: 0, crown: 0 },
    relics: [],
    inventory: { entities: [], concealed: false },
    ownedPanels: [],
    board: { chapterId: null, width: 0, cells: [], panels: {}, deck: [], boss: { uid: null, placed: false, defeated: false } },
    battle: null,
    shop: null,
    counters: {
      harshness: { misfortunes: 0, statusHits: 0, crossBreaks: 0, bonus: 0 },
      battles: 0,
      kills: 0,
      turns: 0,
      flees: 0,
      chaptersCleared: 0,
    },
    memo: {},
  };
}

// JSON で往復した写し (01 の Proxy 規則 3: structuredClone は使わない)
export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function deepEqualJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// 不変条件 (02「不変条件」)。違反を文字列の配列で返す。空なら OK。
// テストとインスペクタが毎コマンド呼ぶ。
export function checkInvariants(state) {
  const v = [];
  const add = (msg) => v.push(msg);
  const ctx = createCtx(state);

  // hp / wallet
  const maxHp = derive("maxHp", ctx);
  if (!(state.player.hp >= 0 && state.player.hp <= maxHp)) add(`player.hp=${state.player.hp} が [0, maxHp=${maxHp}] の外`);
  for (const k of ["coin", "jewel", "crown"]) {
    if (!(state.wallet[k] >= 0)) add(`wallet.${k}=${state.wallet[k]} が負`);
  }

  // inventory
  const slotCount = derive("slotCount", ctx);
  const occupied = new Array(slotCount).fill(null);
  for (const ent of state.inventory.entities) {
    if (!ENTITY_KINDS.includes(ent.kind)) add(`entity uid=${ent.uid} の kind "${ent.kind}" が不正`);
    if (ent.pos < 0) add(`entity uid=${ent.uid} が pos=-1 のまま inventory にいる`);
    const size = entitySize(ent);
    if (ent.pos + size > slotCount) add(`entity uid=${ent.uid} が pos=${ent.pos} size=${size} で slotCount=${slotCount} を超える`);
    for (let i = ent.pos; i < Math.min(ent.pos + size, slotCount); i++) {
      if (i < 0) continue;
      if (occupied[i] != null) add(`inventory マス ${i} が uid=${occupied[i]} と uid=${ent.uid} で重なる`);
      occupied[i] = ent.uid;
    }
  }

  // board
  const seen = new Set();
  const cellUids = state.board.cells.filter((c) => c != null);
  for (const uid of [...cellUids, ...state.board.deck]) {
    if (seen.has(uid)) add(`board に uid=${uid} が重複`);
    seen.add(uid);
    if (!state.board.panels[uid]) add(`board.panels に uid=${uid} が無い`);
  }
  if (state.board.boss.uid != null && !seen.has(state.board.boss.uid) && !state.board.boss.defeated) {
    // ボスは placed 前は cells にも deck にもいない (panels にはいる)
    if (!state.board.panels[state.board.boss.uid]) add(`board.panels にボス uid=${state.board.boss.uid} が無い`);
    seen.add(state.board.boss.uid);
  }
  for (const uid of Object.keys(state.board.panels)) {
    if (!seen.has(Number(uid))) add(`board.panels の uid=${uid} が孤児 (cells / deck / boss のどこにもいない)`);
  }
  if (state.board.chapterId != null && state.board.cells.length !== state.board.width * 2) {
    add(`board.cells の長さ ${state.board.cells.length} が width×2=${state.board.width * 2} でない`);
  }

  // battle
  const b = state.battle;
  if (b) {
    // 勝利後 (battle.victory の boardUpdate 以降) はパネルが取り除かれるか chapterClear に変わっているので、それ以外のときだけ見る
    if (b.result !== "victory") {
      const panel = state.board.panels[b.panelUid];
      if (!panel) add(`battle.panelUid=${b.panelUid} が board.panels に無い`);
      else if (panel.kind !== "enemy") add(`battle.panelUid=${b.panelUid} のパネルが enemy でない`);
      if (!state.board.cells.includes(b.panelUid)) add(`battle.panelUid=${b.panelUid} が board.cells にいない`);
    }
    if (!BATTLE_STEP_NAMES.includes(b.step)) add(`battle.step "${b.step}" が不正`);
    if (b.step === "enemy.action") {
      if (!(b.cursor >= 0)) add(`battle.cursor=${b.cursor} が負`);
    } else if (b.cursor !== 0) {
      add(`battle.cursor=${b.cursor} が enemy.action 以外で 0 でない (step=${b.step})`);
    }
    if (b.result && b.step === "select") add(`battle.result=${b.result} が立っているのに step=select`);
    if (!(b.turn >= 1)) add(`battle.turn=${b.turn} が 1 未満`);
    if (!(b.shield >= 0)) add(`battle.shield=${b.shield} が負`);
  }

  // statuses
  checkStatusList(state.player.statuses, "player.statuses", add);
  if (state.player.unique) {
    if (!(state.player.unique.turns >= 1)) add(`player.unique.turns=${state.player.unique.turns} が 1 未満`);
    const row = master.findByKey("statuses", state.player.unique.key);
    if (!row) add(`player.unique.key="${state.player.unique.key}" が statuses に無い`);
    else if (row.characterId !== state.characterId) add(`player.unique.key="${state.player.unique.key}" が他ヒロインの固有バステ`);
  }
  for (const uid of Object.keys(state.board.panels)) {
    const p = state.board.panels[uid];
    if (p.kind === "enemy" && p.enemy) {
      checkStatusList(p.enemy.statuses, `panels[${uid}].enemy.statuses`, add);
      if (!(p.enemy.shield >= 0)) add(`panels[${uid}].enemy.shield=${p.enemy.shield} が負`);
      if (!(p.enemy.block >= 0)) add(`panels[${uid}].enemy.block=${p.enemy.block} が負`);
    }
  }

  // pending / phase
  if (state.progress.pending.length > 0 && state.progress.ending == null && phaseOfState(state) !== "pending")
    add("pending があるのに phase が pending でない");

  // uid
  let maxUid = UID_START - 1;
  for (const uid of Object.keys(state.board.panels)) maxUid = Math.max(maxUid, Number(uid));
  for (const e of state.inventory.entities) maxUid = Math.max(maxUid, e.uid);
  for (const r of state.relics) maxUid = Math.max(maxUid, r.uid);
  for (const p of state.progress.pending) if (p.entity) maxUid = Math.max(maxUid, p.entity.uid);
  if (!(state.uidNext > maxUid)) add(`uidNext=${state.uidNext} が既存の uid ${maxUid} 以下`);
  if (!(state.uidNext >= UID_START)) add(`uidNext=${state.uidNext} が ${UID_START} 未満`);

  // progress
  const seq = chapterSequence(state);
  const mainLength = master.get("books", state.bookId).chapterIds.length;
  if (state.progress.stage === "main" && !(state.progress.chapterIndex < mainLength))
    add(`stage=main なのに chapterIndex=${state.progress.chapterIndex} >= ${mainLength}`);
  if (state.progress.stage === "extra" && !(state.progress.chapterIndex <= mainLength))
    add(`stage=extra なのに chapterIndex=${state.progress.chapterIndex} > ${mainLength}`);
  if (state.progress.chapterIndex >= seq.length) add(`chapterIndex=${state.progress.chapterIndex} が章の列 (${seq.length}) の外`);

  // JSON 往復
  if (!deepEqualJson(state, cloneState(state))) add("JSON で往復すると同値でない (undefined / 関数 / NaN が混ざっている)");

  return v;
}

function checkStatusList(list, where, add) {
  const keys = new Set();
  for (const s of list) {
    if (keys.has(s.key)) add(`${where} に key=${s.key} が重複`);
    keys.add(s.key);
    if (!(s.value >= 1)) add(`${where} の ${s.key} が value=${s.value} (1 未満)`);
    if (!master.findByKey("statuses", s.key)) add(`${where} の key="${s.key}" が statuses に無い`);
  }
}

// phase.js と循環しないよう、ここだけの簡易版
function phaseOfState(state) {
  if (state.progress.ending != null) return "ended";
  if (state.progress.pending.length > 0) return "pending";
  if (state.battle) return "battle";
  if (state.shop) return "intermission";
  return "chapter";
}
