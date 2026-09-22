// 自動プレイヤーで N ラン。warn / error ゼロ、不変条件違反ゼロ、進行不能なし (08)
import { describe, it, expect } from "vitest";
import { runGame } from "../harness/run_game.js";

const RUNS = 150;

describe("autoplay fuzz", () => {
  it(`${RUNS} ラン通る`, () => {
    const failures = [];
    for (let seed = 1; seed <= RUNS; seed++) {
      const r = runGame({ characterId: 1, bookId: 1, seed, checkInvariants: true });
      if (!r.ok) failures.push(`seed=${seed}\n${r.explain}`);
    }
    expect(failures, failures.slice(0, 3).join("\n\n")).toEqual([]);
  });
});
