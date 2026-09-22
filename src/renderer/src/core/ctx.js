// ============================================================
// ctx — コマンドと効果モジュールが使う「動詞」の束 (03「ctx の動詞」)。1 コマンドにつき 1 つ作る。
// 動詞の中身は verbs/ に 1 関心 1 ファイル。ここは state / master への参照と、それらを束ねるだけ。
// ============================================================
import { master } from "./master/index.js";
import { emit as outboxEmit } from "./outbox.js";
import { randInt, pick, shuffle } from "./rng.js";
import { nextUid } from "./uid.js";
import { derive, deriveWithBreakdown } from "./derived/index.js";
import { permission } from "./permissions/index.js";
import { list } from "./lists/index.js";
import { fireStep } from "./steps/bus.js";
import { battleEnemy, battlePanel } from "./domain/battle.js";
import { damagePlayer, damageEnemy } from "./verbs/damage.js";
import { heal } from "./verbs/heal.js";
import { applyStatus, addBuff } from "./verbs/status.js";
import { gain, spend, recharge } from "./verbs/inventory.js";
import { setCostume, crossBreak } from "./verbs/costume.js";
import { readMemo, writeMemo } from "./verbs/memo.js";

export { describeSource } from "./verbs/_source.js";

export function createCtx(state) {
  const ctx = {
    state,
    master,
    currentStep: null,

    // ---- 基本 ----
    emit: (type, payload = {}) => outboxEmit(type, payload),
    rand: (n) => randInt(state.rng, n),
    pick: (items) => pick(state.rng, items),
    shuffle: (items) => shuffle(state.rng, items),
    uid: () => nextUid(state),
    derive: (name, args) => derive(name, ctx, args),
    breakdown: (name, args) => deriveWithBreakdown(name, ctx, args),
    permission: (name, args) => permission(name, ctx, args),
    list: (name, args) => list(name, ctx, args),
    fire: (step, payload) => fireStep(ctx, step, payload),
    enemy: () => battleEnemy(state),
    enemyPanel: () => battlePanel(state),

    // ---- memo ----
    memo(src, key, value) {
      return arguments.length >= 3 ? writeMemo(state, src, key, value) : readMemo(state, src, key);
    },

    // ---- 動詞 (verbs/) ----
    damagePlayer: (n, opts) => damagePlayer(ctx, n, opts),
    damageEnemy: (n, opts) => damageEnemy(ctx, n, opts),
    heal: (n, opts) => heal(ctx, n, opts),
    applyStatus: (target, key, value, opts) => applyStatus(ctx, target, key, value, opts),
    addBuff: (side, key, value, turns) => addBuff(ctx, side, key, value, turns),
    gain: (kind, defId, opts) => gain(ctx, kind, defId, opts),
    spend: (entity) => spend(ctx, entity),
    recharge: (type, amount, opts) => recharge(ctx, type, amount, opts),
    setCostume: (key, cause) => setCostume(ctx, key, cause),
    crossBreak: () => crossBreak(ctx),
  };
  return ctx;
}
