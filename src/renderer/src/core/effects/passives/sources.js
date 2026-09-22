// passive family の発生源: ON の装備のパッシブ
import { master } from "../../master/index.js";

export function enumerate(state, out) {
  for (const ent of state.inventory.entities) {
    if (ent.kind !== "equipment" || !ent.active) continue;
    const def = master.get("equipments", ent.defId);
    if (!def.passive || !def.passive.type) continue;
    out.push({ family: "passive", key: def.passive.type, def, instance: ent, values: def.passive.values || [] });
  }
}
