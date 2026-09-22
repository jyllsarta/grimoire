// turnOrder: 先攻。base = player。寄与 (choice): enemyAction.blitz → enemy, status.sticky → enemy, passive.blitz → player (final)。敵スタン中は常に player
import { defineDerived } from "./_define.js";
import { battleEnemy } from "../domain/battle.js";

export default defineDerived({
  name: "turnOrder",
  kind: "choice",
  base: () => "player",
  finalize: (v, ctx) => (battleEnemy(ctx.state)?.stunned ? "player" : v),
});
