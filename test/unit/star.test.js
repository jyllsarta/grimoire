// スターパレットのコア (core/star/palette.js、R3 Q3)
import { describe, it, expect } from "vitest";
import { normalize, toggleNode, snapshot, applyPreset, gateOpen, presetNodeIds } from "@core/star/palette.js";
import { master } from "@core/master/index.js";
import { newRun } from "@core/run.js";
import { q } from "@core/queries/index.js";

const noProgress = { star: { activeNodeIds: [], lastPreset: null }, totalCrowns: 0, records: {} };
const cleared = { ...noProgress, records: { 1: { tries: 1, normalEnds: 1, happyEnds: 0, losses: 0, bestDelta: 0, bestHappyDelta: null } } };

describe("star palette", () => {
  it("原点から道がつながっているノードだけが有効 (normalize)", () => {
    expect(normalize(1, [1003], noProgress)).toEqual([]); // 1002 が無いので届かない
    expect(normalize(1, [1002, 1003], noProgress)).toEqual([1002, 1003]);
    expect(normalize(1, [1001, 9999, 1002], noProgress)).toEqual([1002]); // origin と不明 id は含めない
  });

  it("ON は原点からの道を一斉に有効化し、OFF は先が連鎖で落ちる", () => {
    let ids = toggleNode(1, [], 1003, noProgress);
    expect(ids).toEqual([1002, 1003]);
    ids = toggleNode(1, ids, 1004, noProgress);
    expect(ids).toEqual([1002, 1003, 1004]);
    ids = toggleNode(1, ids, 1002, noProgress);
    expect(ids).toEqual([]);
  });

  it("閉じたゲートの先は有効にできない。本を 1 冊制覇すると開く", () => {
    expect(gateOpen(master.get("starNodes", 1021), noProgress)).toBe(false);
    expect(gateOpen(master.get("starNodes", 1021), cleared)).toBe(true);
    expect(toggleNode(1, [1011, 1012], 1022, noProgress)).toEqual([1011, 1012]);
    expect(toggleNode(1, [1011, 1012], 1022, cleared)).toEqual([1011, 1012, 1022]);
    // 開いていたゲートが (進行データの差し替えで) 閉じたら、先は normalize で落ちる
    expect(normalize(1, [1011, 1012, 1022], noProgress)).toEqual([1011, 1012]);
  });

  it("snapshot は有効ノードの効果をそのまま並べ、delta を合計する", () => {
    const snap = snapshot(1, [1011, 1013, 1014], noProgress);
    expect(snap.activeNodeIds).toEqual([1011, 1013, 1014]);
    expect(snap.delta).toBe(-5);
    expect(snap.effects).toEqual([
      { nodeId: 1011, type: "maxHpMinus", values: [5] },
      { nodeId: 1013, type: "badDurationPlus", values: [1] },
      { nodeId: 1014, type: "misfortuneCandidate", values: [13] },
    ]);
    const s = newRun({ characterId: 1, bookId: 1, seed: 1, star: snap });
    expect(q(s).derive("maxHp")).toBe(25);
  });

  it("プリセット: easy / hard はマスタの集合、normal は空。到達できないノードは落ちる", () => {
    expect(applyPreset(1, "easy", noProgress)).toEqual([1002, 1003, 1004]);
    expect(applyPreset(1, "normal", noProgress)).toEqual([]);
    expect(applyPreset(1, "hard", noProgress)).toEqual(presetNodeIds(1, "hard").sort((a, b) => a - b));
    expect(snapshot(1, applyPreset(1, "hard", noProgress), noProgress).delta).toBe(-9);
  });
});
