// slotCount: インベントリのマス数。base = config.startSlots。寄与: relic.slotPlus, star.slot±。[1, config.maxSlots]
import { defineDerived } from "./_define.js";
import { master } from "../master/index.js";

export default defineDerived({
  name: "slotCount",
  kind: "number",
  base: () => master.config.startSlots,
  finalize: (v) => Math.max(1, Math.min(v, master.config.maxSlots)),
});
