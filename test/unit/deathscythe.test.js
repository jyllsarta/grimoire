// デスサイズちゃんの本番仕様 (11) のコア: 敵シールド / リーサルサイズ / 好調 / 回避 / 結晶化 / 体温上昇 / 逆さ吊り / 怪しいプール
import { describe, it, expect } from "vitest";
import { newRun } from "@core/run.js";
import { dispatch } from "@core/commands/index.js";
import { checkInvariants } from "@core/state/schema.js";
import { q, panelAt, eventChoices, rechargeInfo } from "@core/queries/index.js";
import { createCtx } from "@core/ctx.js";
import { collect } from "@core/outbox.js";
import { createEnemyState } from "@core/domain/board.js";
import { runUntil } from "../harness/run_until.js";

// 下段 0 のパネルを指定の敵に差し替えて戦闘に入り、select まで進める
function fightWith(s, enemyId, { hp = null, shield = null } = {}) {
  const ctx = createCtx(s);
  const uid = s.board.cells[0];
  const panel = s.board.panels[uid];
  panel.kind = "enemy";
  panel.defId = enemyId;
  panel.enemy = createEnemyState(ctx, enemyId);
  if (hp != null) panel.enemy.hp = hp;
  if (shield != null) panel.enemy.shield = shield;
  expect(dispatch(s, "startBattle", { cell: 0 }).ok).toBe(true);
  runUntil(s);
  expect(s.battle.step).toBe("select");
  return panel;
}

function give(s, kind, defId, { active = false } = {}) {
  const ctx = createCtx(s);
  const e = ctx.gain(kind, defId, { source: { family: "test", key: "give" } });
  if (active) e.active = true;
  return e;
}

describe("敵のシールド", () => {
  it("通常攻撃はブロック → シールド → HP の順に削る。貫通はシールドも無視", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 911, { hp: 5, shield: 3 }); // シールドの敵
    // 攻撃力 3 (素手) → シールドで全部吸収
    dispatch(s, "attack");
    runUntil(s);
    expect(panel.enemy.shield).toBe(0);
    expect(panel.enemy.hp).toBe(5);
    expect(checkInvariants(s)).toEqual([]);
  });

  it("クナイ (pierceAttack) はシールドを素通りする", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 911, { hp: 5, shield: 3 });
    const kunai = give(s, "item", 2011);
    expect(dispatch(s, "useItem", { uid: kunai.uid }).ok).toBe(true);
    expect(panel.enemy.shield).toBe(3);
    expect(panel.enemy.hp).toBe(4);
    expect(kunai.durability).toBe(2);
  });

  it("敵アクション shield でシールドが増え、逃走しても残る", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 911, { hp: 5, shield: 0 });
    panel.enemy.routineIndex = 1; // 9112 シールド 2
    dispatch(s, "flee");
    runUntil(s);
    expect(panel.enemy.shield).toBe(2);
    dispatch(s, "closeBattle");
    expect(panel.enemy.shield).toBe(2);
  });
});

describe("relic.lethalScythe", () => {
  it("通常攻撃で敵 HP が閾値 (2) 以下になったら倒し、ジャストリーサル扱いで好調が付く", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    expect(s.relics.map((r) => r.defId)).toEqual([11]);
    const panel = fightWith(s, 901, { hp: 5, shield: 0 });
    const { events } = collect(() => {
      dispatch(s, "attack"); // 素手 3 → HP 2
      runUntil(s);
    });
    expect(s.board.panels[panel.uid]).toBeUndefined(); // 倒されて盤面から消えた
    expect(events.some((e) => e.type === "lethalScythe")).toBe(true);
    expect(events.some((e) => e.type === "justLethal")).toBe(true);
    expect(s.player.statuses).toContainEqual({ key: "focus", value: 1 });
    expect(s.battle.step).toBe("battle.end");
    expect(s.battle.result).toBe("victory");
  });

  it("アイテム使用も「行動」なので、HP が閾値以下の敵はどんなアイテムでも倒せる", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    fightWith(s, 901, { hp: 2, shield: 3 });
    const onigiri = give(s, "item", 2001);
    s.player.hp -= 1;
    dispatch(s, "useItem", { uid: onigiri.uid });
    expect(s.battle.result).toBe("victory");
    expect(s.battle.step).toBe("battle.victory");
  });

  it("装備の ON/OFF は行動ではない", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 901, { hp: 2, shield: 0 });
    const sword = give(s, "equipment", 1001);
    dispatch(s, "toggleEquip", { uid: sword.uid });
    expect(panel.enemy.hp).toBe(2);
    expect(s.battle.result).toBeNull();
  });

  it("クリティカルナイフ ON で閾値 +3、死神の目で +1 (派生 lethalThreshold の内訳)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    give(s, "equipment", 1011, { active: true });
    dispatch(s, "debug.addRelic", { defId: 12 });
    const bd = q(s).breakdown("lethalThreshold");
    expect(bd.value).toBe(6);
    expect(bd.breakdown.map((b) => b.label)).toEqual(["base", "relic.lethalScythe", "passive.lethalThresholdPlus", "relic.lethalThresholdPlus"]);
  });

  it("リーサルサイズを持たないキャラでは閾値 0 で発動しない", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.relics = [];
    const panel = fightWith(s, 901, { hp: 5, shield: 0 });
    dispatch(s, "attack");
    runUntil(s);
    expect(panel.enemy.hp).toBe(2);
    expect(s.battle.result).toBeNull();
  });
});

describe("好調 / 回避", () => {
  it("好調は次の 1 回の通常攻撃に +2 して消える", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 901, { hp: 10, shield: 0 });
    const ctx = createCtx(s);
    ctx.applyStatus("player", "focus", 1);
    expect(q(s).derive("attackPower")).toBe(5);
    dispatch(s, "attack");
    runUntil(s, { until: "player.act.end" });
    expect(panel.enemy.hp).toBe(5);
    expect(s.player.statuses.some((x) => x.key === "focus")).toBe(false);
  });

  it("回避は敵の attack 1 発を無効化し、2 発目は当たる。無効化された攻撃では防具が減らない", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const panel = fightWith(s, 903, { hp: 50, shield: 0 });
    panel.enemy.routineIndex = 3; // 9034 連撃 attack 3 / attack 4
    const armor = give(s, "equipment", 1002, { active: true }); // block 2、耐久 2
    const ctx = createCtx(s);
    ctx.applyStatus("player", "evade", 1);
    const hp = s.player.hp;
    const { events } = collect(() => {
      dispatch(s, "attack");
      runUntil(s);
    });
    expect(events.filter((e) => e.type === "enemyAttackNegated").length).toBe(1);
    expect(events.filter((e) => e.type === "enemyAttack").length).toBe(1);
    expect(s.player.hp).toBe(hp - 2); // 4 - block 2
    expect(s.player.statuses.some((x) => x.key === "evade")).toBe(false);
    expect(armor.durability).toBe(1);
  });

  it("身かわしの心得 (battleStartStatus) はバトル開始時に回避 1、クイックムーブ (selfStatus) は kill 3 で復活", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    dispatch(s, "debug.addRelic", { defId: 14 });
    fightWith(s, 901, { hp: 5, shield: 0 });
    expect(s.player.statuses).toContainEqual({ key: "evade", value: 1 });
    const qm = give(s, "ability", 3011);
    dispatch(s, "useAbility", { uid: qm.uid });
    expect(s.player.statuses).toContainEqual({ key: "evade", value: 2 });
    expect(qm.ready).toBe(false);
    expect(rechargeInfo(qm)).toEqual({ type: "kill", textKey: "recharge.kill", progress: 0, target: 3, ready: false });
  });
});

describe("固有バステ", () => {
  it("結晶化: にげる が拒否される (reason crystal)。切れたら逃げられる", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    fightWith(s, 901, { hp: 50, shield: 0 });
    const ctx = createCtx(s);
    ctx.applyStatus("player", "ds_crystal", 1);
    expect(q(s).canFlee()).toMatchObject({ ok: false, reason: "crystal" });
    expect(dispatch(s, "flee")).toEqual({ ok: false, reason: "crystal" });
    dispatch(s, "attack");
    runUntil(s);
    expect(s.player.unique).toBeNull();
    expect(dispatch(s, "flee").ok).toBe(true);
  });

  it("体温上昇: 付与で衣装が full になり、修復不可、切れても full のまま。中はクロスブレイクが効かない", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    fightWith(s, 901, { hp: 50, shield: 0 });
    const ctx = createCtx(s);
    const before = s.counters.harshness;
    const { events } = collect(() => ctx.applyStatus("player", "ds_fever", 1));
    expect(s.player.costume).toBe("full");
    expect(events.some((e) => e.type === "costumeChange" && e.payload.cause === "unique")).toBe(true);
    expect(s.counters.harshness.crossBreaks).toBe(before.crossBreaks);
    expect(s.counters.harshness.statusHits).toBe(1);
    expect(q(s).permission("canRepairCostume")).toMatchObject({ ok: false, reason: "fever" });
    expect(ctx.crossBreak()).toBe(false);
    // 攻撃力の内訳に衣装の -1 は出ない (マスク)
    expect(
      q(s)
        .breakdown("attackPower")
        .breakdown.some((b) => b.label === "costume.full"),
    ).toBe(false);
    dispatch(s, "attack");
    runUntil(s);
    expect(s.player.unique).toBeNull();
    expect(s.player.costume).toBe("full");
    expect(q(s).permission("canRepairCostume").ok).toBe(true);
    expect(
      q(s)
        .breakdown("attackPower")
        .breakdown.some((b) => b.label === "costume.full"),
    ).toBe(true);
  });

  it("他ヒロインの固有バステは付与されない (characterId 1 以外)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.characterId = 0;
    const ctx = createCtx(s);
    expect(ctx.applyStatus("player", "ds_crystal", 1)).toBe(false);
  });
});

describe("イベント", () => {
  function placeEvent(s, eventId) {
    const uid = s.board.cells[0];
    const panel = s.board.panels[uid];
    panel.kind = "event";
    panel.defId = eventId;
    delete panel.enemy;
    return panel;
  }

  it("逆さ吊りトラップ: リュックで実体を全部失い、財布でコインを全部失う。どちらも過酷さ +1", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    give(s, "item", 2011);
    give(s, "equipment", 1001);
    placeEvent(s, 11);
    expect(dispatch(s, "chooseEvent", { cell: 0, choiceIndex: 0 }).ok).toBe(true);
    expect(s.inventory.entities).toEqual([]);
    expect(s.counters.harshness.misfortunes).toBe(1);

    const t = newRun({ characterId: 1, bookId: 1, seed: 1 });
    t.wallet.coin = 7;
    placeEvent(t, 11);
    expect(dispatch(t, "chooseEvent", { cell: 0, choiceIndex: 1 }).ok).toBe(true);
    expect(t.wallet.coin).toBe(0);
    expect(checkInvariants(t)).toEqual([]);
  });

  it("怪しいプール: 毒 3 / 発情 3 + 過酷さ +1 / 羽 + 占有 4 以下なら飛び越えられる", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    placeEvent(s, 13);
    expect(eventChoices(s, 13).map((c) => c.available)).toEqual([true, true, true]);
    expect(dispatch(s, "chooseEvent", { cell: 0, choiceIndex: 2 }).ok).toBe(true);
    expect(s.player.statuses).toEqual([]);
    expect(q(s).derive("harshnessScore")).toBe(1); // 再生 1 回

    const t = newRun({ characterId: 1, bookId: 1, seed: 1 });
    give(t, "equipment", 1001); // size 2
    give(t, "equipment", 1002); // size 2
    give(t, "item", 2001); // size 1 → 占有 5
    placeEvent(t, 13);
    expect(eventChoices(t, 13).map((c) => c.available)).toEqual([true, true, false]);
    expect(dispatch(t, "chooseEvent", { cell: 0, choiceIndex: 2 })).toEqual({ ok: false, reason: "choiceLocked" });
    expect(dispatch(t, "chooseEvent", { cell: 0, choiceIndex: 1 }).ok).toBe(true);
    expect(t.player.statuses).toContainEqual({ key: "arousal", value: 3 });
    expect(t.counters.harshness.bonus).toBe(1);
    expect(q(t).derive("harshnessScore")).toBe(3); // 再生 1 + 発情 1 + bonus 1

    const u = newRun({ characterId: 1, bookId: 1, seed: 1 });
    placeEvent(u, 13);
    dispatch(u, "chooseEvent", { cell: 0, choiceIndex: 0 });
    expect(u.player.statuses).toContainEqual({ key: "poison", value: 3 });
  });
});

describe("レリック取得の即時効果 / ショップ / 回復価格", () => {
  it("maxHpPlus は取得時に現在ライフも増える (relic.gained)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.player.hp = 10;
    dispatch(s, "debug.addRelic", { defId: 3 });
    expect(q(s).derive("maxHp")).toBe(40);
    expect(s.player.hp).toBe(20);
  });

  it("章クリア直後のショップは その他 4 + レリック 1 + レア 1、引き直しは その他 4 + レリック 2 (レア枠なし)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 3 });
    dispatch(s, "debug.clearChapter");
    const kinds = s.shop.slots.map((x) => x.kind);
    expect(kinds.filter((k) => k !== "relic").length).toBe(4);
    expect(kinds.filter((k) => k === "relic").length).toBe(2);
    expect(s.shop.slots.filter((x) => x.rare).length).toBe(1);
    expect(s.shop.slots.filter((x) => x.rare).every((x) => q(s).ctx.master.get("relics", x.defId).rarity >= 2)).toBe(true);
    dispatch(s, "debug.addJewel", { amount: 10 });
    dispatch(s, "rerollShop");
    expect(s.shop.slots.filter((x) => x.kind === "relic").length).toBe(2);
    expect(s.shop.slots.filter((x) => x.rare).length).toBe(0);
  });

  it("幕間の回復価格は次の章の healPrice", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 3 });
    dispatch(s, "debug.clearChapter");
    expect(q(s).derive("healPrice")).toBe(2); // 二章の healPrice
  });

  it("呪われ体質 (misfortuneCandidate) で不利イベントがショップに並び、買うと ownedPanels に入る", () => {
    const s = newRun({
      characterId: 1,
      bookId: 1,
      seed: 3,
      star: { activeNodeIds: [1014], delta: -2, effects: [{ nodeId: 1014, type: "misfortuneCandidate", values: [13] }] },
    });
    const candidates = q(s).ctx.list("shopCandidates");
    expect(candidates).toContainEqual({ kind: "event", defId: 13 });
  });

  it("chapterEnemy [39, 1] で一章の山札に呪い鎧が 1 体増える", () => {
    const base = newRun({ characterId: 1, bookId: 1, seed: 3 });
    const s = newRun({
      characterId: 1,
      bookId: 1,
      seed: 3,
      star: { activeNodeIds: [1015], delta: -2, effects: [{ nodeId: 1015, type: "chapterEnemy", values: [39, 1] }] },
    });
    const count = (st) => Object.values(st.board.panels).filter((p) => p.kind === "enemy" && p.defId === 39).length;
    expect(count(s)).toBe(count(base) + 1);
    const specs2 = q(s).ctx.list("chapterPanelSpecs", { chapterId: 2 });
    expect(specs2.filter((x) => x.kind === "enemy" && x.defId === 39).length).toBe(0);
  });
});
