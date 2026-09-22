// 短い自動プレイの煙テスト (常時回す方。多数ランは fuzz 層)
import { describe, it, expect } from "vitest";
import { runGame } from "../harness/run_game.js";

describe("autoplay smoke", () => {
  it("5 ランが終端に着き、warn / error / 不変条件違反が無い", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const r = runGame({ characterId: 1, bookId: 1, seed, checkInvariants: true });
      expect(r.ok, r.explain).toBe(true);
      expect(["normal", "happy", "lose"]).toContain(r.result.ending);
    }
  });
});
