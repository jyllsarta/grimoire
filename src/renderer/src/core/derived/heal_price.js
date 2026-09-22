// healPrice: 幕間の 1 回復の価格 (ジュエル)。base = クリアした章の chapters.healPrice。寄与: relic.healDiscount。下限 1
import { defineDerived } from "./_define.js";
import { currentChapter } from "../domain/chapter.js";

export default defineDerived({
  name: "healPrice",
  kind: "number",
  base: (ctx) => currentChapter(ctx.state).healPrice ?? 1,
  finalize: (v) => Math.max(1, v),
});
