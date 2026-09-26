// 自動プレイヤー (08、R3 Q4)。queries だけを見て貪欲に手を選ぶ (UI と同じ情報しか使わない)。
// select で手を選び、それ以外のステップは advance を回す。判断用の乱数はゲームの rng とは別ストリーム。
// 目標は「どこまで進めたか」(到達章) を測ること。クリアは必須ではない
import { dispatch } from "../../src/renderer/src/core/commands/index.js";
import { phaseOf, q, panelAt, battleEnemy, currentActions, eventChoices } from "../../src/renderer/src/core/queries/index.js";
import { isAdvanceable } from "../../src/renderer/src/core/steps/index.js";
import { master } from "../../src/renderer/src/core/master/index.js";
import { defOf, entitySize } from "../../src/renderer/src/core/domain/entity.js";
import { findFreePos } from "../../src/renderer/src/core/domain/inventory.js";
import { slotPrice } from "../../src/renderer/src/core/domain/shop.js";

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

function inSelect(state) {
  return phaseOf(state) === "battle" && state.battle.step === "select";
}

// 全部左につめる配置 (保留物を含む)。入らなければ null
function packedArrangement(state, slotCount, extra = null) {
  const all = [...state.inventory.entities, ...(extra ? [extra] : [])];
  let pos = 0;
  const arrangement = [];
  for (const e of all) {
    arrangement.push({ uid: e.uid, pos });
    pos += entitySize(e);
  }
  return pos <= slotCount ? arrangement : null;
}

// 敵のいまのルーチンが撃ってくる合計ダメージ (予告から読める範囲。ブロック前)
function incomingDamage(qq, panel) {
  return currentActions(panel)
    .filter((a) => a.type === "attack")
    .reduce((s, a) => s + qq.derive("enemyAttack", { action: a }), 0);
}

function enemyWillAttack(panel) {
  return currentActions(panel).some((a) => a.type === "attack");
}

// 不利イベントの選択肢の「悪さ」(小さいほど良い)
function choiceBadness(state, choice) {
  let bad = 0;
  for (const eff of choice.effects || []) {
    switch (eff.type) {
      case "loseAllEntities":
        bad += 2 + state.inventory.entities.length * 3;
        break;
      case "loseAllCoins":
        bad += state.wallet.coin;
        break;
      case "status":
        bad += 3 * (eff.value2 ?? 1);
        break;
      case "harshness":
        bad += eff.value ?? 1;
        break;
      case "hp":
        bad += eff.value < 0 ? -eff.value * 2 : -eff.value;
        break;
      case "coins":
        bad -= eff.value ?? 0;
        break;
      case "crossBreak":
        bad += 4;
        break;
      default:
        bad -= 1;
        break;
    }
  }
  return bad;
}

function bestChoiceIndex(state, eventId) {
  const options = eventChoices(state, eventId).filter((c) => c.available);
  if (options.length === 0) return null;
  options.sort((a, b) => choiceBadness(state, a.choice) - choiceBadness(state, b.choice));
  return options[0].index;
}

// select での 1 手 (フリーアクションを打ったら true を返して呼び直してもらう)
function battleSelect(state, rng, onCommand) {
  const qq = q(state);
  const b = state.battle;
  const panel = state.board.panels[b.panelUid];
  const enemy = battleEnemy(state);
  const inv = state.inventory.entities;
  const maxHp = qq.derive("maxHp");
  const lethal = qq.derive("lethalThreshold");
  const willAttack = enemyWillAttack(panel);
  const incoming = incomingDamage(qq, panel);

  // 1. 回復 (ライフ半分以下)
  if (state.player.hp <= maxHp / 2) {
    const heal = inv.find((e) => e.kind === "item" && master.get("items", e.defId).type === "instantHeal" && qq.canUseItem(e).ok);
    if (heal) {
      must(state, "useItem", { uid: heal.uid }, onCommand);
      return true;
    }
  }
  // 2. 倒しきれるアビリティ / アイテム (直接ダメージ)
  const needToKill = (pierce) => enemy.hp + (pierce ? 0 : enemy.shield);
  for (const e of inv) {
    if (e.kind === "ability" && qq.canUseAbility(e).ok) {
      const def = master.get("abilities", e.defId);
      if (def.type === "attack") {
        const dmg = def.values[0] + qq.derive("abilityDamage");
        if (dmg >= needToKill(false) || enemy.hp - dmg <= lethal) {
          must(state, "useAbility", { uid: e.uid }, onCommand);
          return true;
        }
      }
    }
    if (e.kind === "item" && qq.canUseItem(e).ok) {
      const def = master.get("items", e.defId);
      if (def.type === "attack" || def.type === "pierceAttack") {
        const pierce = def.type === "pierceAttack";
        const dmg = def.values[0];
        if (dmg >= needToKill(pierce) || (pierce && enemy.hp - dmg <= lethal && enemy.hp > lethal)) {
          must(state, "useItem", { uid: e.uid }, onCommand);
          return true;
        }
      }
    }
  }
  // 3. 武器: 一撃で削り切れるまで ON (リーサルサイズ圏内なら要らない)
  const flags = qq.derive("strikeFlags");
  const pierce = flags.includes("pierce");
  const need = pierce ? enemy.hp : enemy.hp + enemy.shield + enemy.block;
  if (enemy.hp > lethal || pierce === false) {
    const weapons = inv
      .filter((e) => e.kind === "equipment" && !e.active && master.get("equipments", e.defId).category === "weapon" && qq.canActivateEquipment(e).ok)
      .sort((a, b) => master.get("equipments", b.defId).power - master.get("equipments", a.defId).power);
    for (const w of weapons) {
      const power = qq.derive("attackPower");
      if (power >= need || (power >= need - lethal && lethal > 0 && need - power <= lethal)) break;
      must(state, "toggleEquip", { uid: w.uid }, onCommand);
      return true;
    }
  }
  // 4. 防具: 攻撃が来るなら ON
  if (willAttack) {
    const armor = inv.find(
      (e) => e.kind === "equipment" && !e.active && master.get("equipments", e.defId).category === "armor" && qq.canActivateEquipment(e).ok,
    );
    if (armor && incoming > qq.derive("blockValue")) {
      must(state, "toggleEquip", { uid: armor.uid }, onCommand);
      return true;
    }
    // 5. 回避 / ブロック / シールド系で耐える
    const hasEvade = state.player.statuses.some((s) => s.key === "evade");
    for (const e of inv) {
      if (e.kind === "ability" && qq.canUseAbility(e).ok) {
        const def = master.get("abilities", e.defId);
        if (def.type === "selfStatus" && !hasEvade && incoming >= 2) {
          must(state, "useAbility", { uid: e.uid }, onCommand);
          return true;
        }
        if (def.type === "block" && incoming - qq.derive("blockValue") >= Math.min(state.player.hp, 4)) {
          must(state, "useAbility", { uid: e.uid }, onCommand);
          return true;
        }
      }
      if (e.kind === "item" && qq.canUseItem(e).ok) {
        const def = master.get("items", e.defId);
        if (def.type === "shield" && incoming >= state.player.hp && b.shield === 0) {
          must(state, "useItem", { uid: e.uid }, onCommand);
          return true;
        }
      }
    }
  }
  // 6. 逃げる (死にそうで、倒せない。逃げても 1 回自由行動されるので、耐えられる見込みがあるときだけ)
  const expected = Math.max(0, incoming - qq.derive("blockValue") - b.shield);
  const canKill = qq.derive("attackPower") >= need || enemy.hp <= lethal;
  if (b.started && !canKill && expected >= state.player.hp && qq.canFlee().ok && rng() < 0.5) {
    must(state, "flee", {}, onCommand);
    return true;
  }
  must(state, "attack", {}, onCommand);
  return true;
}

// 1 手打つ。戻り値: 打ったコマンド名 (終了なら null)
export function botStep(state, { rng, playProb = 0.85, onCommand = null } = {}) {
  const phase = phaseOf(state);
  if (phase === "ended") return null;

  if (phase === "pending") {
    const pending = state.progress.pending[0];
    const arrangement = packedArrangement(state, q(state).derive("slotCount"), pending.entity);
    if (arrangement) must(state, "resolvePending", { index: 0, arrangement }, onCommand);
    else must(state, "resolvePending", { index: 0, discard: true }, onCommand);
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
    // select: フリーアクションは 1 手ずつ (state が変わるたびに読み直す)
    for (let guard = 0; guard < 20 && inSelect(state); guard++) {
      battleSelect(state, rng, onCommand);
      if (!inSelect(state)) break;
    }
    return "select";
  }

  if (phase === "intermission") {
    const qq = q(state);
    while (state.player.hp < qq.derive("maxHp") && state.wallet.jewel >= qq.derive("healPrice")) must(state, "buyHeal", {}, onCommand);
    // レリック (レアから) → その他 (安い順)
    const slots = state.shop.slots.map((slot, i) => ({ slot, i, price: slotPrice(slot) }));
    slots.sort(
      (a, b) =>
        Number(b.slot.kind === "relic") - Number(a.slot.kind === "relic") ||
        Number(b.slot.rare) - Number(a.slot.rare) ||
        a.price.jewel - b.price.jewel,
    );
    for (const { slot, i, price } of slots) {
      if (slot.soldOut) continue;
      if (slot.kind === "event") continue; // 不利イベントは買わない
      if (state.wallet.jewel < price.jewel || state.wallet.crown < price.crown) continue;
      const r = dispatch(state, "buyShopSlot", { index: i });
      onCommand?.("buyShopSlot", { index: i }, r);
    }
    must(state, "enterNextChapter", {}, onCommand);
    return "enterNextChapter";
  }

  // chapter
  const qq = q(state);
  const cells = [];
  for (let c = 0; c < state.board.width; c++) if (panelAt(state, c)) cells.push(c);
  if (cells.length === 0) throw new Error("盤面に選べるパネルが無い (進行不能)");
  const panels = cells.map((cell) => ({ cell, panel: panelAt(state, cell) }));

  const clear = panels.find((p) => p.panel.kind === "chapterClear");
  if (clear) {
    must(state, "takeChapterClear", { cell: clear.cell }, onCommand);
    return "takeChapterClear";
  }
  // 非戦闘で食べられる回復 (ライフ半分以下)
  if (state.player.hp <= qq.derive("maxHp") / 2) {
    const heal = state.inventory.entities.find(
      (e) => e.kind === "item" && master.get("items", e.defId).type === "instantHeal" && qq.canUseItem(e).ok,
    );
    if (heal) {
      must(state, "useItem", { uid: heal.uid }, onCommand);
      return "useItem";
    }
  }
  // 良いイベント (misfortune でない) は先に
  const goodEvent = panels.find((p) => p.panel.kind === "event" && master.get("events", p.panel.defId).kind !== "misfortune");
  if (goodEvent) {
    const i = bestChoiceIndex(state, goodEvent.panel.defId);
    if (i != null) {
      must(state, "chooseEvent", { cell: goodEvent.cell, choiceIndex: i }, onCommand);
      return "chooseEvent";
    }
  }
  // 買えて入るパネルは取る
  const slotCount = qq.derive("slotCount");
  for (const p of panels) {
    if (!["equipment", "item", "ability"].includes(p.panel.kind)) continue;
    const def = defOf(p.panel);
    const cost = qq.derive("panelCost", { def, panel: p.panel });
    if (state.wallet.coin < cost) continue;
    if (findFreePos(state, def.size, slotCount) < 0) continue;
    must(state, "takePanel", { cell: p.cell }, onCommand);
    return "takePanel";
  }
  // 弱い敵から
  const enemies = panels
    .filter((p) => p.panel.kind === "enemy")
    .sort((a, b) => a.panel.enemy.hp + a.panel.enemy.shield - (b.panel.enemy.hp + b.panel.enemy.shield));
  const hpRatio = state.player.hp / qq.derive("maxHp");
  if (enemies.length && (hpRatio > 0.3 || rng() < 0.5)) {
    must(state, "startBattle", { cell: enemies[0].cell }, onCommand);
    return "startBattle";
  }
  // 取れないパネルは捨ててコインにする
  const dumpable = panels.find((p) => ["equipment", "item", "ability"].includes(p.panel.kind));
  if (dumpable) {
    must(state, "dumpPanel", { cell: dumpable.cell }, onCommand);
    return "dumpPanel";
  }
  // 不利イベントは最後
  const badEvent = panels.find((p) => p.panel.kind === "event");
  if (badEvent) {
    const i = bestChoiceIndex(state, badEvent.panel.defId);
    must(state, "chooseEvent", { cell: badEvent.cell, choiceIndex: i ?? 0 }, onCommand);
    return "chooseEvent";
  }
  must(state, "startBattle", { cell: enemies[0].cell }, onCommand);
  return "startBattle";
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
