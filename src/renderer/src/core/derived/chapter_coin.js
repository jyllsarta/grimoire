// chapterCoin: 章突入時コイン。base = characters.coins。寄与: star.chapterCoin±。下限 0
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "chapterCoin",
  kind: "number",
  base: (ctx) => master.get("characters", ctx.state.characterId).coins ?? 0,
  finalize: (v) => Math.max(0, v),
});
