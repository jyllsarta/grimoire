import { describe, it, expect } from "vitest";
import { newRun } from "@core/run.js";
import { dispatch } from "@core/commands/index.js";
import { panelAt } from "@core/queries/index.js";
import { createCtx } from "@core/ctx.js";
import { collect } from "@core/outbox.js";

describe("status.poison", () => {
  it("player.tick でスタック値ダメージ → -1、0 で消える。シールドを貫通する", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const cell = [...Array(s.board.width).keys()].find((c) => panelAt(s, c)?.kind === "enemy");
    dispatch(s, "startBattle", { cell });
    dispatch(s, "advance"); // battle.start → turn.start
    dispatch(s, "advance"); // turn.start → select
    s.battle.shield = 5;
    const ctx = createCtx(s);
    expect(ctx.applyStatus("player", "poison", 2)).toBe(true);
    expect(s.player.statuses).toEqual([{ key: "poison", value: 2 }]);
    expect(s.counters.harshness.statusHits).toBe(1);
    const hp = s.player.hp;
    dispatch(s, "attack"); // select → turn.command
    dispatch(s, "advance"); // turn.command を実行 → player.tick
    const { events } = collect(() => dispatch(s, "advance")); // player.tick を実行 → turn.order
    expect(s.battle.step).toBe("turn.order");
    expect(s.player.hp).toBe(hp - 2);
    expect(s.battle.shield).toBe(5);
    expect(s.player.statuses).toEqual([{ key: "poison", value: 1 }]);
    expect(events.map((e) => e.type)).toContain("playerPoisonTick");
  });

  it("回復で全部消える (実回復 0 でも)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const ctx = createCtx(s);
    s.player.statuses.push({ key: "poison", value: 3 });
    const { events } = collect(() => ctx.heal(1));
    expect(s.player.statuses).toEqual([]);
    expect(events.map((e) => e.type)).toContain("poisonCured");
  });

  it("side が合わない付与はスキップされる (sleep を敵に)", () => {
    const s = newRun({ characterId: 1, bookId: 1, seed: 1 });
    const cell = [...Array(s.board.width).keys()].find((c) => panelAt(s, c)?.kind === "enemy");
    dispatch(s, "startBattle", { cell });
    const ctx = createCtx(s);
    const { result, events } = collect(() => ctx.applyStatus(s.battle.panelUid, "sleep", 1));
    expect(result).toBe(false);
    expect(events.map((e) => e.type)).toContain("statusSkipped");
  });
});
