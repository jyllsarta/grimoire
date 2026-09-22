// startHp: run.start の現在ライフ。base = maxHp。寄与: star.startHpMinus (final)。[1, maxHp]
import { defineDerived } from "./_define.js";
import { derive } from "./index.js";

export default defineDerived({
  name: "startHp",
  kind: "number",
  base: (ctx) => derive("maxHp", ctx),
  finalize: (v, ctx) => Math.max(1, Math.min(v, derive("maxHp", ctx))),
});
