// blockValue: 被弾とパリィ。ON の防具の block は標準の flat。寄与: passive.blockPerAbilityThisTurn, buff.blockDelta。下限 0
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";
import { activeArmors } from "../domain/inventory.js";

export default defineDerived({
  name: "blockValue",
  kind: "number",
  base: () => 0,
  standardFlat: (ctx) =>
    activeArmors(ctx.state).map((e) => ({ label: "armor", value: master.get("equipments", e.defId).block, uid: e.uid, defId: e.defId })),
  finalize: (v) => Math.max(0, v),
});
