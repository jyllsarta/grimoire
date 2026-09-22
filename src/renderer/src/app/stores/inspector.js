// state インスペクタ (08)。dev 限定。dispatch の前後の写しを deep diff して変わったパスを光らせる
import { defineStore } from "pinia";
import { validateMaster } from "@core/master/validate.js";
import { checkInvariants } from "@core/state/schema.js";

function diffPaths(a, b, path = "", out = []) {
  if (a === b) return out;
  if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) {
    out.push(path || "(root)");
    return out;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) diffPaths(a[k], b[k], path ? `${path}.${k}` : k, out);
  return out;
}

export const useInspectorStore = defineStore("inspector", {
  state: () => ({
    open: false,
    tab: "state",
    snapshot: null,
    changedPaths: [],
    changedAt: 0,
    lastCommand: null,
    lastEvents: [],
    invariants: [],
    masterWarnings: [],
    history: [],
  }),
  actions: {
    toggle() {
      this.open = !this.open;
    },
    setMasterWarnings(tables) {
      this.masterWarnings = validateMaster(tables);
    },
    // dispatch の後に呼ぶ (run ストアの onDispatched)
    afterDispatch({ name, args, result, events, state }) {
      const next = JSON.parse(JSON.stringify(state));
      this.changedPaths = this.snapshot ? diffPaths(this.snapshot, next) : [];
      this.changedAt = Date.now();
      this.snapshot = next;
      this.lastCommand = { name, args, result };
      this.lastEvents = events.map((e) => ({ type: e.type, payload: e.payload }));
      this.invariants = checkInvariants(state);
      this.history.unshift({
        name,
        args: JSON.stringify(args),
        ok: result.ok,
        reason: result.reason ?? null,
        events: events.length,
        step: state.battle?.step ?? null,
      });
      if (this.history.length > 40) this.history.pop();
    },
    reset(state) {
      this.snapshot = state ? JSON.parse(JSON.stringify(state)) : null;
      this.changedPaths = [];
      this.lastCommand = null;
      this.lastEvents = [];
      this.invariants = state ? checkInvariants(state) : [];
      this.history = [];
    },
  },
});
