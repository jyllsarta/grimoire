import { describe, it, expect } from "vitest";
import { newRun, serialize, deserialize } from "@core/run.js";
import { checkInvariants } from "@core/state/schema.js";
import { phaseOf } from "@core/state/phase.js";
import { dispatch } from "@core/commands/index.js";
import { q } from "@core/queries/index.js";

describe("newRun", () => {
  it("初期状態が不変条件を満たし、章画面から始まる", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    expect(checkInvariants(s)).toEqual([]);
    expect(phaseOf(s)).toBe("chapter");
    expect(s.uidNext).toBeGreaterThanOrEqual(10001);
    expect(s.player.hp).toBe(q(s).derive("maxHp"));
    expect(s.board.cells.length).toBe(s.board.width * 2);
    expect(s.board.cells.every((c) => c != null)).toBe(true);
    expect(s.inventory.entities.length).toBe(1); // startAbilityIds [3001]
  });
  it("同じ seed なら同じ盤面", () => {
    const a = newRun({ characterId: 1, bookId: 1, seed: 5 });
    const b = newRun({ characterId: 1, bookId: 1, seed: 5 });
    a.meta = b.meta;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("serialize → deserialize で同値", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 2 });
    const back = deserialize(serialize(s));
    expect(back).toEqual(s);
    expect(deserialize("{bad json")).toBeNull();
    expect(deserialize(null)).toBeNull();
  });
  it("star の効果が派生値に乗る", () => {
    const base = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const s = newRun({
      characterId: 1,
      bookId: 1,
      seed: 1,
      star: { activeNodeIds: [1002], delta: 2, effects: [{ nodeId: 1002, type: "maxHpPlus", values: [5] }] },
    });
    expect(q(s).derive("maxHp")).toBe(q(base).derive("maxHp") + 5);
    const bd = q(s).breakdown("maxHp").breakdown;
    expect(bd.some((b) => b.label === "star.maxHpPlus")).toBe(true);
  });
  it("フェーズ外のコマンドは拒否される", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    expect(dispatch(s, "attack").ok).toBe(false);
    expect(dispatch(s, "advance").ok).toBe(false);
    expect(dispatch(s, "enterNextChapter").ok).toBe(false);
    expect(dispatch(s, "nope").reason).toBe("unknownCommand");
  });
});
