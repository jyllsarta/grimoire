// crownGain: 章クリア時のクラウン。base = chapters.clearCrownBonus。寄与: star.crown±。下限 0
import { defineDerived } from "./_define.js";
import { currentChapter } from "../domain/chapter.js";

export default defineDerived({
  name: "crownGain",
  kind: "number",
  base: (ctx) => currentChapter(ctx.state).clearCrownBonus ?? 0,
  finalize: (v) => Math.max(0, v),
});
