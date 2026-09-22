// 処理順の規則 (03): order → レジストリ順 → uid。代表的な組み合わせで期待順を固定する
import { describe, it, expect } from "vitest";
import { newRun } from "@core/run.js";
import { resolvedOrder } from "@core/queries/index.js";
import { registry } from "@core/effects/index.js";

describe("処理順", () => {
  it("レジストリは family の並びが固定で、key が重複しない", () => {
    expect(registry.families).toEqual(["status", "costume", "bookRule", "passive", "relic", "star", "item", "ability", "enemyAction", "eventEffect"]);
    const keys = registry.all.map((m) => `${m.family}.${m.key}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("turn.end: relic.healEachTurn (300) → standard.advance (500) → standard.recharge (600)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.relics.push({ uid: s.uidNext++, defId: 4, memo: {} }); // 無限わかめ
    const names = resolvedOrder(s, "turn.end").map((h) => `${h.name}@${h.order}`);
    expect(names).toEqual(["relic.healEachTurn@300", "standard.advance@500", "standard.recharge@600"]);
  });

  it("同じ order の同じモジュールが 2 つあれば uid 昇順", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const a = s.uidNext++;
    const b = s.uidNext++;
    s.relics.push({ uid: b, defId: 4, memo: {} }, { uid: a, defId: 4, memo: {} });
    const order = resolvedOrder(s, "turn.end").filter((h) => h.name === "relic.healEachTurn");
    expect(order.map((h) => h.uid)).toEqual([a, b]);
  });

  it("player.tick: 毒は標準処理 statusTick (500) の後 (レジストリはさらに後)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.player.statuses.push({ key: "poison", value: 2 });
    const names = resolvedOrder(s, "player.tick").map((h) => h.name);
    expect(names).toEqual(["standard.statusTick", "status.poison"]);
  });

  it("player.strike.after: passive.drain (300) → passive.poison (400) → standard.weaponWear (500)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    s.inventory.entities = [
      { uid: s.uidNext++, kind: "equipment", defId: 1004, pos: 0, durability: 2, active: true, memo: {} }, // poison
      { uid: s.uidNext++, kind: "equipment", defId: 1006, pos: 2, durability: 2, active: true, memo: {} }, // drain
    ];
    const names = resolvedOrder(s, "player.strike.after").map((h) => h.name);
    expect(names).toEqual(["passive.drain", "passive.poison", "standard.weaponWear"]);
  });
});
