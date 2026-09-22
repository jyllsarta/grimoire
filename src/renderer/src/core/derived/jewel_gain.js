// jewelGain: 章クリア時のジュエル。base = 未使用コイン + 残パネル数 (盤面 + 山札) + chapters.clearJewelBonus。寄与: star.jewel±。下限 0
import { defineDerived } from "./_define.js";
import { currentChapter } from "../domain/chapter.js";

export default defineDerived({
  name: "jewelGain",
  kind: "number",
  base: (ctx) => {
    const st = ctx.state;
    const remaining = st.board.cells.filter((c) => c != null).length + st.board.deck.length;
    return st.wallet.coin + remaining + (currentChapter(st).clearJewelBonus ?? 0);
  },
  finalize: (v) => Math.max(0, v),
});
