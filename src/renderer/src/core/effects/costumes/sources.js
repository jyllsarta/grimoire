// costume family の発生源: player.costume (unique 中はマスク。表示も効果も無視される。04)
import { master } from "../../master/index.js";

export function enumerate(state, out) {
  const def = master.byKey("statuses", state.player.costume);
  out.push({ family: "costume", key: def.effect || def.key, def, masked: state.player.unique != null });
}
