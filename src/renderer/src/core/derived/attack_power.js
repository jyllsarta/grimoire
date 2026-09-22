// attackPower: 攻撃ボタンの予測と一撃。base = basePower、ON の武器の power は標準の flat。
// 寄与: relic.weaponAttack, passive.powerPerAbilityThisTurn, buff.powerDelta, status.power, costume.half/full (-1、unique 中は除外), unique statuses
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";
import { derive } from "./index.js";
import { activeWeapons } from "../domain/inventory.js";

export default defineDerived({
  name: "attackPower",
  kind: "number",
  base: (ctx) => derive("basePower", ctx),
  standardFlat: (ctx) =>
    activeWeapons(ctx.state).map((e) => ({ label: "weapon", value: master.get("equipments", e.defId).power, uid: e.uid, defId: e.defId })),
  finalize: (v) => Math.max(0, v),
});
