// 盤面 (02 board)。幅 width × 2。下段 0..width-1 が選べる、上段 width..2width-1 がネクスト
import { master } from "../master/index.js";
import { nextUid } from "../uid.js";
import { derive } from "../derived/index.js";
import { list } from "../lists/index.js";

export function createEnemyState(ctx, defId) {
  return {
    hp: derive("enemyMaxHp", ctx, { defId }),
    routineIndex: 0,
    stunned: false,
    block: 0,
    statuses: [],
    buffs: [],
    damageTaken: [],
    memo: {},
  };
}

function createPanel(ctx, spec, isBoss = false) {
  const panel = { uid: nextUid(ctx.state), kind: spec.kind, defId: spec.defId, isBoss };
  if (spec.kind === "enemy") panel.enemy = createEnemyState(ctx, spec.defId);
  return panel;
}

// 章の山札を組んで盤面を充填する (chapter.build の標準処理 buildBoard)
export function buildBoard(ctx, chapterId) {
  const state = ctx.state;
  const chapter = master.get("chapters", chapterId);
  const specs = list("chapterPanelSpecs", ctx, { chapterId });
  const board = {
    chapterId,
    width: chapter.width,
    cells: new Array(chapter.width * 2).fill(null),
    panels: {},
    deck: [],
    boss: { uid: null, placed: false, defeated: false },
  };
  state.board = board;
  for (const spec of specs) {
    const panel = createPanel(ctx, spec);
    board.panels[panel.uid] = panel;
    board.deck.push(panel.uid);
  }
  const bossDef = master.get("enemies", chapter.bossEnemyId);
  if (bossDef.kind === "placeholder") throw new Error(`chapters ${chapterId} の bossEnemyId=${chapter.bossEnemyId} が placeholder (ボスは固定)`);
  const boss = createPanel(ctx, { kind: "enemy", defId: chapter.bossEnemyId }, true);
  board.panels[boss.uid] = boss;
  board.boss.uid = boss.uid;
  // 下段左 → 右、上段左 → 右 の順に配る
  for (let cell = 0; cell < board.cells.length; cell++) refillCell(ctx, cell);
}

// 空きマスに山札から 1 枚 (rng で選ぶ)。山札が空ならボス (未配置なら)。何も無ければそのまま
export function refillCell(ctx, cell) {
  const board = ctx.state.board;
  if (board.cells[cell] != null) return false;
  if (board.deck.length > 0) {
    const i = ctx.rand(board.deck.length);
    const uid = board.deck.splice(i, 1)[0];
    board.cells[cell] = uid;
    ctx.emit("panelRefill", { cell, uid });
    return true;
  }
  if (!board.boss.placed && !board.boss.defeated && board.boss.uid != null) {
    board.cells[cell] = board.boss.uid;
    board.boss.placed = true;
    ctx.emit("bossAppear", { cell, uid: board.boss.uid });
    return true;
  }
  return false;
}

export function panelAt(state, cell) {
  const uid = state.board.cells[cell];
  return uid == null ? null : state.board.panels[uid];
}

export function isSelectableCell(state, cell) {
  return Number.isInteger(cell) && cell >= 0 && cell < state.board.width;
}

// 下段のパネルを取り除き、上段が落ちて、上段を補充する
export function removePanel(ctx, cell) {
  const board = ctx.state.board;
  const uid = board.cells[cell];
  if (uid == null) return;
  delete board.panels[uid];
  board.cells[cell] = null;
  if (board.boss.uid === uid) board.boss.defeated = true;
  const upper = cell + board.width;
  if (upper < board.cells.length && board.cells[upper] != null) {
    board.cells[cell] = board.cells[upper];
    board.cells[upper] = null;
    ctx.emit("panelFall", { from: upper, to: cell, uid: board.cells[cell] });
    refillCell(ctx, upper);
  }
}

// ボス撃破: そのパネルを chapterClear パネルに変える
export function turnIntoChapterClear(ctx, uid) {
  const panel = ctx.state.board.panels[uid];
  panel.kind = "chapterClear";
  panel.defId = null;
  delete panel.enemy;
  ctx.state.board.boss.defeated = true;
  ctx.emit("chapterClearAppear", { uid });
}

// 敵のルーチン (enemyActions を order 順に回る)
export function enemyRoutines(defId) {
  return master.whereSorted("enemyActions", "enemyId", defId);
}

export function currentRoutine(panel) {
  const routines = enemyRoutines(panel.defId);
  if (routines.length === 0) return null;
  return routines[panel.enemy.routineIndex % routines.length];
}

export function currentActions(panel) {
  return currentRoutine(panel)?.actions ?? [];
}

// 残パネルの内訳 (UI 用)
export function deckSummary(state) {
  const counts = {};
  for (const uid of state.board.deck) {
    const p = state.board.panels[uid];
    counts[p.kind] = (counts[p.kind] || 0) + 1;
  }
  return counts;
}
