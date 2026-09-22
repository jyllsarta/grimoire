// advance を select か battle.end (または指定ステップ) まで回す。シナリオテストとボットが使う
import { dispatch } from "../../src/renderer/src/core/commands/index.js";
import { isAdvanceable } from "../../src/renderer/src/core/timeline/steps.js";

export function runUntil(state, { until = null, max = 200, onCommand = null } = {}) {
  let n = 0;
  while (state.battle && isAdvanceable(state.battle.step)) {
    if (until && state.battle.step === until) break;
    const r = dispatch(state, "advance");
    onCommand?.("advance", r);
    if (!r.ok) throw new Error(`advance が拒否された: ${r.reason} (step=${state.battle.step})`);
    n += 1;
    if (n > max) throw new Error(`advance が ${max} 回を超えた (step=${state.battle.step}) — 進行不能`);
  }
  return n;
}
