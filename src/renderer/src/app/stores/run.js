// ============================================================
// run ストア (01「データの流れ」): 実物の state を reactive で 1 本晒し、書くのは dispatch だけ。
// dispatch は core のコマンドを呼び、成功したらオートセーブし、そのコマンドで出た一発物を購読者に配る。
// UI の状態 (選択中のマス、演出中フラグ) は GameState には入れずここに置く。
// ============================================================
import { defineStore } from "pinia";
import { dispatch as coreDispatch } from "@core/commands/index.js";
import { subscribe } from "@core/outbox.js";
import { newRun, serialize, deserialize } from "@core/run.js";
import { phaseOf } from "@core/state/phase.js";
import { useSessionStore } from "./session.js";

// dispatch 中に出た一発物を集めるための購読 (モジュール変数だが state ではない)
let collecting = null;
subscribe((e) => {
  if (collecting) collecting.push(e);
});

const listeners = new Set();
// app 側 (Fragments / Sound / StepMover / Inspector) が「コマンド 1 回ぶんの一発物」を受け取る
export function onDispatched(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const useRunStore = defineStore("run", {
  state: () => ({
    state: null,
    epoch: 0,
    selectedCell: null,
    lastCommand: null,
    lastEvents: [],
    busy: false,
  }),
  getters: {
    phase: (s) => (s.state ? phaseOf(s.state) : null),
    battle: (s) => s.state?.battle ?? null,
  },
  actions: {
    setState(state) {
      this.state = state;
      this.epoch += 1;
      this.selectedCell = null;
      this.lastCommand = null;
      this.lastEvents = [];
    },
    start({ characterId, bookId, seed = Date.now() % 1000000, star = null, difficulty = null }) {
      const session = useSessionStore();
      const state = newRun({ characterId, bookId, seed, star, difficulty, appVersion: __APP_VERSION__, edition: __EDITION__ });
      this.setState(state);
      session.recordTry(characterId, bookId);
      session.saveRun(serialize(state));
      return state;
    },
    async resume() {
      const session = useSessionStore();
      const json = await session.loadRun();
      const state = deserialize(json);
      if (!state) {
        if (json) console.warn("run.json をマイグレートできないので破棄する");
        await session.removeRun();
        return null;
      }
      this.setState(state);
      return state;
    },
    clear() {
      this.state = null;
      this.epoch += 1;
    },
    select(cell) {
      this.selectedCell = this.selectedCell === cell ? null : cell;
    },
    // 唯一の書き込み口
    dispatch(name, args = {}) {
      if (!this.state) return { ok: false, reason: "noState" };
      const events = [];
      const wasEnded = this.state.progress.ending != null;
      collecting = events;
      let result;
      try {
        result = coreDispatch(this.state, name, args);
      } finally {
        collecting = null;
      }
      this.lastCommand = { name, args, result };
      this.lastEvents = events;
      if (result.ok) {
        const session = useSessionStore();
        // ending が確定した瞬間に 1 回だけ戦績へ記録して run.json を消す (06)。それ以外はオートセーブ
        if (this.state.progress.ending != null) {
          if (!wasEnded) session.recordEnding(this.state);
        } else session.saveRun(serialize(this.state));
      }
      for (const fn of listeners) fn({ name, args, result, events, state: this.state });
      return result;
    },
  },
});
