// relic family の発生源: 所持レリック
import { master } from "../../master/index.js";

export function enumerate(state, out) {
  for (const relic of state.relics) {
    const def = master.get("relics", relic.defId);
    out.push({ family: "relic", key: def.type, def, instance: relic, values: def.values || [] });
  }
}
