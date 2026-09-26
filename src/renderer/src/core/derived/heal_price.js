// healPrice: 幕間の 1 回復の価格 (ジュエル)。base = 次に入る章の chapters.healPrice (R3 Q19。Extra 前の幕間なら Extra Chapter)。寄与: relic.healDiscount。下限 1
import { defineDerived } from "./_define.js";
import { currentChapter, nextChapterId } from "../domain/chapter.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "healPrice",
  kind: "number",
  base: (ctx) => {
    const next = nextChapterId(ctx.state);
    const chapter = next == null ? currentChapter(ctx.state) : master.get("chapters", next);
    return chapter.healPrice ?? 1;
  },
  finalize: (v) => Math.max(1, v),
});
