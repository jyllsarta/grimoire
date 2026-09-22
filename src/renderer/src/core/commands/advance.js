// ============================================================
// advance — バトルのステップマシンを 1 つ進める (03「バトルのステップ」)。
// いまの battle.step を実行し、表の「次」を書く。settle 点で result が立っていれば victory / defeat に差し替える。
// ============================================================

import { BATTLE_STEPS, isAdvanceable } from "../steps/index.js";
import { settleStep } from "../domain/battle.js";
import { currentActions } from "../domain/board.js";

export function advance(ctx) {
  const state = ctx.state;
  const b = state.battle;
  if (!b) return { ok: false, reason: "notInBattle" };
  if (!isAdvanceable(b.step)) return { ok: false, reason: "notAdvanceable" };

  const step = b.step;
  const def = BATTLE_STEPS[step];
  ctx.fire(step);

  // battle.defeat の中で ending が立つが、battle.end へは進める (closeBattle は ended では受け付けない)
  const enemy = ctx.enemy();
  const actions = enemy ? currentActions(ctx.enemyPanel()) : [];
  let next = def.next(b, enemy, actions);
  if (def.settle) next = settleStep(b, next);
  if (step === "enemy.act.begin" && next === "enemy.action") b.cursor = 0;
  if (next !== "enemy.action") b.cursor = 0;
  b.step = next;
  ctx.emit("step", { from: step, to: next });
  return { ok: true, step: next };
}

// フリーアクションの末尾: select で result が立っていれば victory / defeat へ (03「結果の確定」)
export function settleAfterFreeAction(ctx) {
  const b = ctx.state.battle;
  if (!b || b.step !== "select" || !b.result) return;
  b.step = settleStep(b, b.step);
  ctx.emit("step", { from: "select", to: b.step });
}
