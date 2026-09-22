// 不変条件 (02) を毎コマンド検査するコレクタ。違反は distinct なメッセージで集める
import { checkInvariants } from "../../src/renderer/src/core/state/schema.js";

export function makeInvariantCollector() {
  const set = new Set();
  let everEnded = false;
  return {
    get violations() {
      return [...set];
    },
    afterCommand(state, command) {
      for (const v of checkInvariants(state)) set.add(`${v} (after ${command})`);
      const ended = state.progress.ending != null;
      if (everEnded && !ended) set.add("ゲーム終了後に未終了へ反転");
      everEnded = everEnded || ended;
    },
  };
}
