// ============================================================
// 標準処理 (コアが必ずやること)。03 の表の「標準処理 (order)」列がそのまま並ぶ。
// order を公開するので、効果モジュールはその前後どちらにも付ける。
// ============================================================

import { master } from "../master/index.js";
import { buildBoard, currentActions, removePanel, turnIntoChapterClear } from "../domain/board.js";
import { createEntity } from "../domain/entity.js";
import { findFreePos } from "../domain/inventory.js";
import { tickBuffs, decayStatuses, decayUnique } from "../domain/battle.js";
import { makeShop } from "../domain/shop.js";
import { isExtraChapter, isLastMainChapter, currentChapterId } from "../domain/chapter.js";
import { registry } from "../effects/index.js";

// 章開始状態のインベントリ (派生リスト startEntities を実体化)
function resetInventoryToStart(ctx) {
  const state = ctx.state;
  state.inventory.entities = [];
  state.inventory.concealed = false;
  const slotCount = ctx.derive("slotCount");
  for (const spec of ctx.list("startEntities")) {
    const entity = createEntity(ctx.uid(), spec.kind, spec.defId);
    const size = master.get({ equipment: "equipments", item: "items", ability: "abilities" }[spec.kind], spec.defId).size;
    const pos = findFreePos(state, size, slotCount);
    if (pos < 0) throw new Error(`開始インベントリが入り切らない: ${spec.kind} ${spec.defId} (slotCount=${slotCount})`);
    entity.pos = pos;
    state.inventory.entities.push(entity);
    ctx.fire("entity.gained", { entity, source: { family: "standard", key: "start" } });
  }
}

function std(name, order, run) {
  return { name, order, run };
}

export const STANDARD = {
  // ---- ラン・章スコープ ----
  "run.start": [
    std("initialize", 500, (ctx) => {
      const state = ctx.state;
      state.player.hp = ctx.derive("startHp");
      state.wallet.coin = ctx.derive("chapterCoin");
      resetInventoryToStart(ctx);
    }),
  ],
  "chapter.build": [
    std("buildBoard", 500, (ctx) => {
      buildBoard(ctx, currentChapterId(ctx.state));
      ctx.emit("chapterBuild", { chapterId: ctx.state.board.chapterId });
    }),
  ],
  "chapter.start": [],
  "panel.taken": [],
  "panel.dumped": [],
  "entity.gained": [],
  "entity.spent": [std("recharge", 500, (ctx) => {}) /* recharge(exhaust) は ctx.spend が行う */],
  "event.resolved": [
    std("harshness", 500, (ctx, src, payload) => {
      if (payload?.misfortune) {
        ctx.state.counters.harshness.misfortunes += 1;
        ctx.emit("harshnessGain", { kind: "misfortune" });
      }
    }),
  ],
  "chapter.clear": [
    std("rewards", 500, (ctx) => {
      const state = ctx.state;
      const jewel = ctx.derive("jewelGain");
      const crown = ctx.derive("crownGain");
      state.wallet.jewel += jewel;
      state.wallet.crown += crown;
      state.star.crownsGained += crown;
      state.counters.chaptersCleared += 1;
      ctx.emit("rewards", { jewel, crown, coin: state.wallet.coin });
    }),
    std("reset", 600, (ctx) => {
      const state = ctx.state;
      state.wallet.coin = 0;
      state.player.statuses = [];
      state.player.unique = null;
      state.player.costume = "normal";
      resetInventoryToStart(ctx);
      ctx.emit("chapterClear", { chapterId: state.board.chapterId });
    }),
    std("decideNext", 700, (ctx) => {
      const state = ctx.state;
      if (isExtraChapter(state)) {
        state.progress.ending = "happy";
        ctx.fire("run.end", { ending: "happy" });
        return;
      }
      if (isLastMainChapter(state)) {
        const book = master.get("books", state.bookId);
        const score = ctx.derive("harshnessScore");
        if (book.extraChapterId != null && score >= book.harshnessThreshold) {
          state.progress.stage = "extra";
          ctx.emit("extraUnlocked", { score, threshold: book.harshnessThreshold });
        } else {
          state.progress.ending = "normal";
          ctx.fire("run.end", { ending: "normal" });
          return;
        }
      }
      makeShop(ctx);
      ctx.fire("intermission.enter");
    }),
  ],
  "intermission.enter": [],
  "intermission.leave": [],
  "action.item": [],
  "action.ability": [
    std("count", 500, (ctx) => {
      const b = ctx.state.battle;
      if (b) b.turnMemo.abilitiesUsed = (b.turnMemo.abilitiesUsed || 0) + 1;
    }),
  ],
  "action.equipToggle": [],
  "player.damaged": [],
  "enemy.damaged": [],
  "run.end": [],

  // ---- バトル ----
  "battle.start": [
    std("create", 500, (ctx) => {
      const b = ctx.state.battle;
      b.shield = ctx.derive("battleStartShield");
      b.turn = 1;
      ctx.state.counters.battles += 1;
      ctx.emit("battleStart", { panelUid: b.panelUid, shield: b.shield });
    }),
  ],
  "turn.start": [
    std("fireDelayed", 500, (ctx) => {
      const b = ctx.state.battle;
      ctx.emit("turnStart", { turn: b.turn });
      if (b.turn < 2 || b.delayed.length === 0) return;
      const delayed = b.delayed;
      b.delayed = [];
      for (const d of delayed) {
        const mod = registry.find("ability", d.key);
        ctx.emit("delayedFire", { key: d.key });
        mod?.fire?.(ctx, d);
      }
    }),
  ],
  select: [],
  "turn.command": [
    std("command", 500, (ctx) => {
      const b = ctx.state.battle;
      b.started = true;
      if (!ctx.permission("canAct").ok) b.turnMemo.skipPlayer = true;
    }),
  ],
  "player.tick": [std("statusTick", 500, () => {}) /* 毒などは status モジュールがここに登録する */],
  "turn.order": [
    std("order", 500, (ctx) => {
      const b = ctx.state.battle;
      b.turnMemo.order = ctx.derive("turnOrder");
      if (b.turnMemo.order === "enemy") ctx.emit("blitz", {});
    }),
  ],
  "player.strike.before": [],
  "player.strike": [
    std("strike", 500, (ctx) => {
      const power = ctx.derive("attackPower");
      const flags = ctx.derive("strikeFlags");
      const r = ctx.damageEnemy(power, { ignoreBlock: flags.includes("pierce"), tag: "strike", source: { family: "standard", key: "strike" } });
      ctx.state.battle.turnMemo.lastStrikeDmg = r.dmg;
      ctx.emit("playerStrike", { power, flags, dmg: r.dmg, blocked: r.blocked });
    }),
  ],
  "player.strike.after": [
    std("weaponWear", 500, (ctx) => {
      const weapons = ctx.state.inventory.entities.filter(
        (e) => e.kind === "equipment" && e.active && master.get("equipments", e.defId).category === "weapon",
      );
      for (const w of weapons) {
        ctx.emit("weaponWear", { uid: w.uid });
        ctx.spend(w);
      }
    }),
  ],
  "player.act.skipped": [std("sleepSkip", 500, (ctx) => ctx.emit("sleepSkip", {}))],
  "player.act.end": [
    std("statusDecay", 500, (ctx) => {
      // 毒は player.tick で自分で -1 するのでここでは減らさない
      const skipKeys = ctx.state.player.statuses
        .filter((s) => registry.find("status", master.byKey("statuses", s.key).effect || s.key)?.flags?.decaysOnTick)
        .map((s) => s.key);
      decayStatuses(ctx, ctx.state.player, "player", { skipKeys });
      decayUnique(ctx);
    }),
    std("buffsTick", 600, (ctx) => tickBuffs(ctx, ctx.state.battle, "player")),
  ],
  "enemy.act.begin": [
    std("blockReset", 500, (ctx) => {
      ctx.enemy().block = 0;
      ctx.emit("enemyRoutineStart", { routineIndex: ctx.enemy().routineIndex });
    }),
    std("enemyStatusTick", 600, () => {}),
  ],
  "enemy.stunned": [
    std("unstun", 500, (ctx) => {
      ctx.enemy().stunned = false;
      ctx.emit("enemyStunned", {});
    }),
    std("enemyBuffsTick", 600, (ctx) => tickBuffs(ctx, ctx.enemy(), "enemy")),
    std("enemyStatusDecay", 650, (ctx) => enemyStatusDecay(ctx)),
    std("routineAdvance", 700, (ctx) => {
      ctx.enemy().routineIndex += 1;
    }),
  ],
  "enemy.action": [
    std("resolve", 500, (ctx) => {
      const b = ctx.state.battle;
      const panel = ctx.enemyPanel();
      const actions = currentActions(panel);
      const action = actions[b.cursor];
      b.cursor += 1;
      if (!action) return;
      const src = { family: "enemyAction", key: action.type, def: master.get("enemies", panel.defId), action };
      const mod = registry.find("enemyAction", action.type);
      if (mod) {
        mod.use(ctx, src, action);
      } else if (master.findByKey("statuses", action.type)) {
        ctx.applyStatus("player", action.type, action.value ?? 1, { source: src });
      } else {
        throw new Error(`enemyActions: 不明な type "${action.type}" (enemy ${panel.defId})`);
      }
    }),
  ],
  "enemy.act.after": [
    std("armorWear", 200, (ctx) => {
      const b = ctx.state.battle;
      if (!b.turnMemo.enemyAttacked) return;
      const armors = ctx.state.inventory.entities.filter(
        (e) => e.kind === "equipment" && e.active && master.get("equipments", e.defId).category === "armor",
      );
      for (const a of armors) {
        ctx.emit("armorWear", { uid: a.uid });
        ctx.spend(a);
      }
    }),
    std("parry", 300, (ctx) => {
      const b = ctx.state.battle;
      const enemy = ctx.enemy();
      if (b.turnMemo.enemyAttacked && b.turnMemo.attacksBlocked && !b.turnMemo.attackPassed && !b.turnMemo.pierced) {
        enemy.stunned = true;
        ctx.emit("parry", {});
      }
    }),
    std("enemyBuffsTick", 500, (ctx) => tickBuffs(ctx, ctx.enemy(), "enemy")),
    std("enemyStatusDecay", 550, (ctx) => enemyStatusDecay(ctx)),
    std("routineAdvance", 600, (ctx) => {
      ctx.enemy().routineIndex += 1;
    }),
  ],
  "turn.end": [
    std("advance", 500, (ctx) => {
      const b = ctx.state.battle;
      b.turn += 1;
      b.turnMemo = {};
      ctx.state.counters.turns += 1;
    }),
    std("recharge", 600, (ctx) => ctx.recharge("turn", 1)),
  ],
  "flee.command": [
    std("command", 500, (ctx) => {
      const b = ctx.state.battle;
      b.started = true;
      b.turnMemo.fleeing = true;
      ctx.emit("fleeStart", {});
    }),
  ],
  "flee.done": [
    std("done", 500, (ctx) => {
      const b = ctx.state.battle;
      b.result = "flee";
      ctx.state.counters.flees += 1;
      ctx.emit("fleeDone", {});
    }),
  ],
  "battle.victory": [
    std("reward", 100, (ctx) => {
      const panel = ctx.enemyPanel();
      const coin = ctx.derive("killReward", { defId: panel.defId });
      ctx.state.wallet.coin += coin;
      ctx.emit("victory", { coin, uid: panel.uid, isBoss: panel.isBoss });
    }),
    std("rechargeKill", 200, (ctx) => ctx.recharge("kill", 1)),
    std("rechargeTurn", 300, (ctx) => ctx.recharge("turn", 1)),
    std("boardUpdate", 500, (ctx) => {
      const state = ctx.state;
      const panel = ctx.enemyPanel();
      state.counters.kills += 1;
      if (panel.isBoss) {
        turnIntoChapterClear(ctx, panel.uid);
      } else {
        const cell = state.board.cells.indexOf(panel.uid);
        removePanel(ctx, cell);
      }
    }),
  ],
  "battle.defeat": [
    std("lose", 500, (ctx) => {
      ctx.state.progress.ending = "lose";
      ctx.emit("defeat", {});
      ctx.fire("run.end", { ending: "lose" });
    }),
  ],
  "battle.end": [
    std("clear", 500, (ctx) => {
      ctx.state.battle.delayed = [];
    }),
  ],
};

function enemyStatusDecay(ctx) {
  const enemy = ctx.enemy();
  const skipKeys = enemy.statuses
    .filter((s) => registry.find("status", master.byKey("statuses", s.key).effect || s.key)?.flags?.decaysOnTick)
    .map((s) => s.key);
  decayStatuses(ctx, enemy, "enemy", { skipKeys });
}
