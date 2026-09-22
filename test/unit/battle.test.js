import { describe, it, expect } from "vitest";
import { newRun } from "@core/run.js";
import { dispatch } from "@core/commands/index.js";
import { checkInvariants } from "@core/state/schema.js";
import { panelAt } from "@core/queries/index.js";
import { collect } from "@core/outbox.js";
import { runUntil } from "../harness/run_until.js";

// 盤面の下段から敵のマスを探して戦闘を始める。いなければ敵以外を捨てて落としてくる
function startAnyBattle(s) {
  for (let guard = 0; guard < 30; guard++) {
    for (let c = 0; c < s.board.width; c++) {
      if (panelAt(s, c)?.kind === "enemy") {
        expect(dispatch(s, "startBattle", { cell: c }).ok).toBe(true);
        return c;
      }
    }
    const c = [...Array(s.board.width).keys()].find((i) => panelAt(s, i) && panelAt(s, i).kind !== "chapterClear");
    if (c == null) break;
    const p = panelAt(s, c);
    const r = p.kind === "event" ? dispatch(s, "chooseEvent", { cell: c, choiceIndex: 0 }) : dispatch(s, "dumpPanel", { cell: c });
    if (!r.ok) throw new Error(`パネルを片付けられない: ${r.reason}`);
  }
  throw new Error("下段に敵がいない");
}

describe("バトルのステップマシン", () => {
  it("startBattle → advance で select に着き、attack → advance で 1 ターン回って select か battle.end に戻る", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 3 });
    startAnyBattle(s);
    expect(s.battle.step).toBe("battle.start");
    runUntil(s);
    expect(s.battle.step).toBe("select");
    expect(s.battle.started).toBe(false);
    expect(checkInvariants(s)).toEqual([]);

    const { events } = collect(() => {
      expect(dispatch(s, "attack").ok).toBe(true);
      expect(s.battle.step).toBe("turn.command");
      runUntil(s);
    });
    expect(["select", "battle.end"]).toContain(s.battle.step);
    expect(s.battle.started).toBe(true);
    expect(events.some((e) => e.type === "playerStrike")).toBe(true);
    expect(checkInvariants(s)).toEqual([]);
  });

  it("started=false のうちは cancelBattle が無料、started 後は拒否", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 3 });
    startAnyBattle(s);
    runUntil(s);
    expect(dispatch(s, "cancelBattle").ok).toBe(true);
    expect(s.battle).toBeNull();
    startAnyBattle(s);
    runUntil(s);
    dispatch(s, "attack");
    runUntil(s);
    if (s.battle && s.battle.step === "select") expect(dispatch(s, "cancelBattle")).toEqual({ ok: false, reason: "battleStarted" });
  });

  it("select 以外では attack を受け付けない", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 3 });
    startAnyBattle(s);
    expect(dispatch(s, "attack").ok).toBe(false);
  });

  it("flee は敵に 1 回自由行動されてから battle.end に着き、closeBattle で盤面に戻る (敵の状態は残る)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 4 });
    const cell = startAnyBattle(s);
    runUntil(s);
    const uid = s.battle.panelUid;
    const { events } = collect(() => {
      expect(dispatch(s, "flee").ok).toBe(true);
      runUntil(s);
    });
    expect(events.some((e) => e.type === "enemyRoutineStart")).toBe(true);
    expect(events.some((e) => e.type === "fleeDone")).toBe(true);
    // 逃走で倒れたらそこまで
    if (s.progress.ending) return;
    expect(s.battle.step).toBe("battle.end");
    expect(s.battle.result).toBe("flee");
    expect(dispatch(s, "closeBattle").ok).toBe(true);
    expect(s.battle).toBeNull();
    expect(s.board.cells[cell]).toBe(uid);
    expect(s.board.panels[uid].enemy.routineIndex).toBe(1);
    expect(checkInvariants(s)).toEqual([]);
  });
});
