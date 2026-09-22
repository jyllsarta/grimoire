// ============================================================
// UI が読む問い合わせ。state を変えない。内訳、許可、処理順、公開情報
// ============================================================

import { createCtx } from "../ctx.js";
import { phaseOf } from "../state/phase.js";
import { derive, deriveWithBreakdown, DERIVED_NAMES } from "../derived/index.js";
import { permission, PERMISSION_NAMES } from "../permissions/index.js";
import { resolveHandlers } from "../steps/bus.js";
import { ALL_STEP_NAMES } from "../steps/index.js";
import { chapterSequence, currentChapterId, currentChapter } from "../domain/chapter.js";
import { panelAt, currentRoutine, currentActions, deckSummary } from "../domain/board.js";
import { battleEnemy } from "../domain/battle.js";
import { adjacent } from "../domain/inventory.js";
import { canDispatch, COMMAND_NAMES } from "../commands/index.js";
import { master } from "../master/index.js";

export { phaseOf, chapterSequence, currentChapterId, currentChapter, panelAt, currentRoutine, currentActions, deckSummary, battleEnemy, adjacent };
export { DERIVED_NAMES, PERMISSION_NAMES };
export const STEP_NAMES = ALL_STEP_NAMES;

export function q(state) {
  const ctx = createCtx(state);
  return {
    ctx,
    derive: (name, args) => derive(name, ctx, args),
    breakdown: (name, args) => deriveWithBreakdown(name, ctx, args),
    permission: (name, args) => permission(name, ctx, args),
    canAct: () => permission("canAct", ctx),
    canActivateEquipment: (entity) => permission("canActivateEquipment", ctx, { entity }),
    canUseAbility: (entity) => permission("canUseAbility", ctx, { entity }),
    canUseItem: (entity) => permission("canUseItem", ctx, { entity }),
  };
}

// そのステップに並ぶハンドラを order 順に (インスペクタの処理順ビューア)
export function resolvedOrder(state, step) {
  return resolveHandlers(state, step).map((h) => ({ order: h.order, name: h.name, family: h.src.family, key: h.src.key, uid: h.uid || null }));
}

// いま受け付けるコマンド名の一覧 (ボットとインスペクタ用)
export function availableCommands(state) {
  return COMMAND_NAMES.filter((name) => !name.startsWith("debug.") && canDispatch(state, name).ok);
}

// enemy.damageTaken を tag / source で絞った合計 (派生 damageBy)
export function damageBy(enemy, filter = {}) {
  return enemy.damageTaken
    .filter((d) => (filter.tag ? d.tag === filter.tag : true))
    .filter((d) => (filter.family ? d.source?.family === filter.family : true))
    .filter((d) => (filter.defId != null ? d.source?.defId === filter.defId : true))
    .reduce((a, d) => a + d.amount, 0);
}

// 本を持つ character = ヒロイン (00 の命名規則)
export function heroines() {
  const ids = new Set(master.all("books").map((b) => b.characterId));
  return master
    .all("characters")
    .filter((c) => ids.has(c.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function booksOf(characterId) {
  return master.whereSorted("books", "characterId", characterId);
}
