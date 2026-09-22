// 動詞: setCostume / crossBreak (04 衣装のオートマトン)
import { master } from "../master/index.js";

// 変わったときだけ true
export function setCostume(ctx, key, cause = "item") {
  if (!master.findByKey("statuses", key)) throw new Error(`statuses に衣装 key=${key} が無い`);
  const from = ctx.state.player.costume;
  if (from === key) return false;
  ctx.state.player.costume = key;
  ctx.emit("costumeChange", { from, to: key, cause });
  return true;
}

// unique 中は何もしない。衣装が実際に変わったときだけ過酷さを数える
export function crossBreak(ctx) {
  const state = ctx.state;
  if (state.player.unique) {
    ctx.emit("crossBreakIgnored", { costume: state.player.costume });
    return false;
  }
  const from = state.player.costume;
  const to = master.byKey("statuses", from).next;
  if (!to || to === from) {
    ctx.emit("crossBreak", { from, to: from, changed: false });
    return false;
  }
  setCostume(ctx, to, "crossBreak");
  state.counters.harshness.crossBreaks += 1;
  ctx.emit("crossBreak", { from, to, changed: true });
  return true;
}
