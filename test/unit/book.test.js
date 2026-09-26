// M2 の完了条件: デスサイズちゃんの本 1 冊が node で完走できる (ノーマル / ハッピーの両方の経路)
import { describe, it, expect } from "vitest";
import { newRun } from "@core/run.js";
import { dispatch } from "@core/commands/index.js";
import { checkInvariants } from "@core/state/schema.js";
import { q, panelAt, eventChoices } from "@core/queries/index.js";

// 章のボスを即勝利で倒し、クリアパネルを踏む
function clearChapterByDebug(s) {
  for (let guard = 0; guard < 200; guard++) {
    for (let c = 0; c < s.board.width; c++) {
      const p = panelAt(s, c);
      if (!p) continue;
      if (p.kind === "chapterClear") {
        expect(dispatch(s, "takeChapterClear", { cell: c }).ok).toBe(true);
        return;
      }
    }
    for (let c = 0; c < s.board.width; c++) {
      const p = panelAt(s, c);
      if (!p) continue;
      if (p.kind === "enemy") {
        dispatch(s, "startBattle", { cell: c });
        dispatch(s, "debug.winBattle");
        dispatch(s, "advance"); // battle.victory → battle.end
        dispatch(s, "closeBattle");
        break;
      }
      if (p.kind === "event") {
        // 選べる中でいちばん後ろの選択肢 (怪しいプールは「飛び越えた」= 被害なし)
        const options = eventChoices(s, p.defId).filter((x) => x.available);
        dispatch(s, "chooseEvent", { cell: c, choiceIndex: options[options.length - 1].index });
        break;
      }
      dispatch(s, "dumpPanel", { cell: c });
      break;
    }
    if (s.progress.pending.length) dispatch(s, "resolvePending", { index: 0, discard: true });
  }
  throw new Error("章をクリアできない");
}

describe("死神の本", () => {
  it("過酷さ未達ならノーマルエンド", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 11 });
    for (let i = 0; i < 3; i++) {
      clearChapterByDebug(s);
      expect(checkInvariants(s)).toEqual([]);
      if (s.progress.ending) break;
      if (s.shop) dispatch(s, "enterNextChapter");
    }
    // 不利イベントは被害なしの選択肢で通るので、過酷さは再生回数ぶんだけ (閾値 6 には届かない)
    expect(q(s).derive("harshnessScore")).toBeLessThan(6);
    expect(s.progress.ending).toBe("normal");
    expect(s.counters.chaptersCleared).toBe(3);
  });

  it("過酷さ達成なら幕間 → Extra Chapter → ハッピーエンド", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 11 });
    s.counters.harshness.statusHits = 10;
    for (let i = 0; i < 4; i++) {
      clearChapterByDebug(s);
      expect(checkInvariants(s)).toEqual([]);
      if (s.progress.ending) break;
      expect(s.shop).not.toBeNull();
      if (i === 2) {
        expect(s.progress.stage).toBe("extra");
        expect(q(s).derive("healPrice")).toBe(3); // Extra の healPrice
      }
      dispatch(s, "enterNextChapter");
    }
    expect(s.progress.ending).toBe("happy");
    expect(s.counters.chaptersCleared).toBe(4);
  });
});
