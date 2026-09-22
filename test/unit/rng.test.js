import { describe, it, expect } from "vitest";
import { createRng, nextU32, randInt, shuffle, pick } from "@core/rng.js";

describe("rng (xoshiro128**)", () => {
  it("同じ seed なら同じ列", () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 20 }, () => nextU32(a));
    const ys = Array.from({ length: 20 }, () => nextU32(b));
    expect(xs).toEqual(ys);
  });
  it("違う seed なら違う列", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(nextU32(a)).not.toBe(nextU32(b));
  });
  it("randInt は [0, n) に収まる", () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = randInt(r, 5);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(5);
    }
    expect(randInt(r, 0)).toBe(0);
  });
  it("state は JSON で往復できる (u32 の配列)", () => {
    const r = createRng(3);
    nextU32(r);
    const copy = JSON.parse(JSON.stringify(r));
    expect(nextU32(copy)).toBe(nextU32(r));
  });
  it("shuffle / pick は元の要素だけを使う", () => {
    const r = createRng(9);
    const list = shuffle(r, [1, 2, 3, 4, 5]);
    expect([...list].sort()).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3]).toContain(pick(r, [1, 2, 3]));
  });
});
