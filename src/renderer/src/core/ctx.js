// ============================================================
// ctx — コマンドと効果モジュールが使う「動詞」(03「ctx の動詞」)。横断規則はここに 1 回だけ書く。
// 1 コマンドにつき 1 つ作る。state と master への参照と、outbox / rng / 派生値へのショートカットを持つ。
// ============================================================

import { master } from "./master/index.js";
import { emit as outboxEmit } from "./outbox.js";
import { randInt, pick, shuffle } from "./rng.js";
import { nextUid } from "./uid.js";
import { derive, deriveWithBreakdown, permission, list } from "./timeline/derive.js";
import { fireStep } from "./timeline/bus.js";
import { battleEnemy } from "./timeline/sources.js";
import { createEntity, tableOfKind } from "./domain/entity.js";
import { findFreePos, removeEntity } from "./domain/inventory.js";
import { registry } from "./effects/index.js";

export function createCtx(state) {
  const ctx = {
    state,
    master,
    currentStep: null,

    // ---- 基本 ----
    emit(type, payload = {}) {
      return outboxEmit(type, payload);
    },
    rand(n) {
      return randInt(state.rng, n);
    },
    pick(items) {
      return pick(state.rng, items);
    },
    shuffle(items) {
      return shuffle(state.rng, items);
    },
    uid() {
      return nextUid(state);
    },
    derive(name, args) {
      return derive(name, ctx, args);
    },
    breakdown(name, args) {
      return deriveWithBreakdown(name, ctx, args);
    },
    permission(name, args) {
      return permission(name, ctx, args);
    },
    list(name, args) {
      return list(name, ctx, args);
    },
    fire(step, payload) {
      fireStep(ctx, step, payload);
    },
    enemy() {
      return battleEnemy(state);
    },
    enemyPanel() {
      return state.battle ? state.board.panels[state.battle.panelUid] : null;
    },

    // ---- memo (src のスコープの memo に "<family>.<key>" 名前空間で読み書き) ----
    memo(src, key, value) {
      const scope = memoScope(state, src);
      const ns = `${src.family}.${src.statusKey ?? src.key}`;
      if (arguments.length >= 3) {
        (scope[ns] ||= {})[key] = value;
        return value;
      }
      return scope[ns]?.[key];
    },

    // ---- ダメージ ----
    // シールドを先に削る (pierceShield なら貫通)。実際にライフが減った分だけ damageTakenThisTurn と recharge(damageTaken) を進める。
    // 0 以下で battle.result = defeat (ステップは settle が変える)。バトル外なら ending = lose
    damagePlayer(n, { tag = "enemyAttack", pierceShield = false, source = null } = {}) {
      const p = state.player;
      const b = state.battle;
      let remaining = Math.max(0, n);
      let absorbed = 0;
      if (b && !pierceShield && b.shield > 0) {
        absorbed = Math.min(b.shield, remaining);
        b.shield -= absorbed;
        remaining -= absorbed;
      }
      const hpLoss = Math.min(p.hp, remaining);
      p.hp -= hpLoss;
      if (b) {
        b.turnMemo.damageTakenThisTurn = (b.turnMemo.damageTakenThisTurn || 0) + hpLoss;
      }
      if (hpLoss > 0) ctx.recharge("damageTaken", hpLoss);
      ctx.emit("playerDamage", { tag, dmg: n, hpLoss, absorbed, source: describeSource(source) });
      ctx.fire("player.damaged", { tag, dmg: n, hpLoss, absorbed, source });
      if (p.hp <= 0) {
        if (b) b.result = "defeat";
        else if (state.progress.ending == null) {
          state.progress.ending = "lose";
          ctx.fire("run.end", { ending: "lose" });
        }
      }
      return { hpLoss, absorbed };
    },

    // ブロック処理。通ったダメージを enemy.damageTaken に発生源つきで 1 件積む。ちょうど 0 で recharge(justLethal)。0 以下で result = victory
    damageEnemy(n, { ignoreBlock = false, tag = "strike", source = null } = {}) {
      const enemy = ctx.enemy();
      if (!enemy) throw new Error("damageEnemy: バトル中でない");
      const block = ignoreBlock ? 0 : enemy.block;
      const dmg = Math.max(0, n - block);
      const blocked = n - dmg;
      enemy.hp -= dmg;
      enemy.damageTaken.push({ tag, source: describeSource(source), amount: dmg, turn: state.battle.turn });
      ctx.emit("enemyDamage", { tag, dmg, blocked, source: describeSource(source) });
      if (blocked > 0 && !ignoreBlock) ctx.emit("enemyBlocked", { blocked });
      ctx.fire("enemy.damaged", { tag, dmg, blocked, source });
      if (enemy.hp === 0) ctx.recharge("justLethal", 1);
      if (enemy.hp <= 0) state.battle.result = "victory";
      return { dmg, blocked };
    },

    // 上限は maxHp。実回復 0 でも「回復で消える」ステート (flags.curedByHeal) は全部消える
    heal(n, { source = null } = {}) {
      const p = state.player;
      const maxHp = ctx.derive("maxHp");
      const before = p.hp;
      p.hp = Math.min(maxHp, p.hp + Math.max(0, n));
      const healed = p.hp - before;
      ctx.emit("heal", { amount: n, healed, source: describeSource(source) });
      const cured = [];
      p.statuses = p.statuses.filter((s) => {
        const mod = statusModule(s.key);
        if (mod?.flags?.curedByHeal) {
          cured.push(s.key);
          return false;
        }
        return true;
      });
      for (const key of cured) {
        statusModule(key)?.onExpire?.(ctx, { family: "status", key, statusKey: key, side: "player" });
        ctx.emit("poisonCured", { key });
      }
      return healed;
    },

    // 04 の付与規則。target は "player" か 敵の panelUid
    applyStatus(target, key, value, { source = null } = {}) {
      const perm = ctx.permission("canApplyStatus", { target, key });
      if (!perm.ok) {
        ctx.emit("statusSkipped", { target, key, value, reason: perm.reason });
        return false;
      }
      const def = master.byKey("statuses", key);
      let amount = value;
      if (def.polarity === "bad") amount = ctx.derive("statusValue", { key, value, target });
      if (amount < 1) return false;
      const side = target === "player" ? "player" : "enemy";
      const src = { family: "status", key: def.effect || def.key, statusKey: key, def, side };
      if (def.kind === "unique") {
        // 上書き (別の固有バステでも同じでも)。上書き前の onExpire は呼ばない
        state.player.unique = { key, turns: amount };
        ctx.emit("uniqueApply", { key, turns: amount });
      } else {
        const holder = target === "player" ? state.player : state.board.panels[target].enemy;
        const existing = holder.statuses.find((s) => s.key === key);
        if (existing) {
          if (def.duration === "turn") existing.value = amount;
          else existing.value += amount;
        } else {
          holder.statuses.push({ key, value: amount });
        }
        ctx.emit("statusApply", { target, key, value: amount, polarity: def.polarity });
      }
      statusModule(key)?.onApply?.(ctx, src, { target, value: amount });
      if (side === "player" && def.polarity === "bad") state.counters.harshness.statusHits += 1;
      return true;
    },

    // 同 key は加算 (stackable)、turns は最新で上書き
    addBuff(side, key, value, turns) {
      const holder = side === "player" ? state.battle : ctx.enemy();
      if (!holder) throw new Error("addBuff: バトル中でない");
      const existing = holder.buffs.find((b) => b.key === key);
      if (existing) {
        existing.value += value;
        existing.turns = turns;
      } else {
        holder.buffs.push({ key, value, turns });
      }
      ctx.emit(side === "player" ? "selfBuff" : "enemyDebuff", { key, value, turns });
    },

    // 空きがあれば配置して entity.gained。無ければ progress.pending に積む
    gain(kind, defId, { source = null } = {}) {
      const entity = createEntity(ctx.uid(), kind, defId);
      const size = master.get(tableOfKind(kind), defId).size;
      const pos = findFreePos(state, size, ctx.derive("slotCount"));
      if (pos >= 0) {
        entity.pos = pos;
        state.inventory.entities.push(entity);
        ctx.emit("gain", { uid: entity.uid, kind, defId, pos });
        ctx.fire("entity.gained", { entity, source });
      } else {
        state.progress.pending.push({ kind: "gain", entity, source: describeSource(source) });
        ctx.emit("pendingGain", { uid: entity.uid, kind, defId });
      }
      return entity;
    },

    // 耐久 -1、0 で消して entity.spent
    spend(entity) {
      if (entity.durability < 0) return false;
      entity.durability -= 1;
      if (entity.durability > 0) return false;
      removeEntity(state, entity.uid);
      ctx.emit({ equipment: "equipBreak", item: "itemBreak", ability: "abilityBreak" }[entity.kind], {
        uid: entity.uid,
        kind: entity.kind,
        defId: entity.defId,
      });
      ctx.fire("entity.spent", { entity, kind: entity.kind });
      ctx.recharge("exhaust", 1);
      return true;
    },

    // 休んでいるアビリティの progress を進め、達成で ready
    recharge(type, amount, { excludeDefId = null } = {}) {
      for (const ent of state.inventory.entities) {
        if (ent.kind !== "ability" || ent.ready) continue;
        if (excludeDefId != null && ent.defId === excludeDefId) continue;
        const def = master.get("abilities", ent.defId);
        if (def.rechargeType !== type) continue;
        ent.progress += amount;
        if (ent.progress >= (def.rechargeValue ?? 1)) {
          ent.ready = true;
          ent.progress = 0;
          ctx.emit("abilityReady", { uid: ent.uid, defId: ent.defId });
        }
      }
    },

    // 衣装 (04)。変わったときだけ true
    setCostume(key, cause = "item") {
      if (!master.findByKey("statuses", key)) throw new Error(`statuses に衣装 key=${key} が無い`);
      const from = state.player.costume;
      if (from === key) return false;
      state.player.costume = key;
      ctx.emit("costumeChange", { from, to: key, cause });
      return true;
    },

    // クロスブレイク。unique 中は何もしない。衣装が実際に変わったときだけ過酷さを数える
    crossBreak() {
      if (state.player.unique) {
        ctx.emit("crossBreakIgnored", { costume: state.player.costume });
        return false;
      }
      const from = state.player.costume;
      const def = master.byKey("statuses", from);
      const to = def.next;
      if (!to || to === from) {
        ctx.emit("crossBreak", { from, to: from, changed: false });
        return false;
      }
      ctx.setCostume(to, "crossBreak");
      state.counters.harshness.crossBreaks += 1;
      ctx.emit("crossBreak", { from, to, changed: true });
      return true;
    },
  };
  return ctx;
}

function memoScope(state, src) {
  if (src.instance?.memo) return src.instance.memo;
  if (src.scope === "battle" && state.battle) return state.battle.memo;
  if (src.scope === "turn" && state.battle) return state.battle.turnMemo;
  return state.memo;
}

function statusModule(key) {
  const def = master.findByKey("statuses", key);
  if (!def) return null;
  return registry.find(def.kind === "costume" ? "costume" : "status", def.effect || def.key);
}

export function describeSource(source) {
  if (!source) return null;
  return {
    family: source.family ?? null,
    key: source.key ?? source.statusKey ?? null,
    defId: source.def?.id ?? source.defId ?? null,
    uid: source.instance?.uid ?? source.uid ?? null,
  };
}
