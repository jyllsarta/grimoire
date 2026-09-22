import { describe, it, expect } from "vitest";
import tables from "@masterdata/index.js";
import { validateMaster } from "@core/master/validate.js";
import { TABLE_NAMES } from "@core/master/tables.js";

describe("masterdata (base)", () => {
  it("全テーブルがある", () => {
    for (const name of TABLE_NAMES) expect(tables).toHaveProperty(name);
  });
  it("レジストリ駆動の検証が通る", () => {
    const problems = validateMaster(tables);
    expect(problems.filter((p) => p.level === "error")).toEqual([]);
  });
});
