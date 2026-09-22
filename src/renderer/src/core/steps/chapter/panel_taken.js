// panel.taken: 盤面パネルを回収して実体がインベントリに入った後 (payload: { entity, panel })
import { defineStep } from "../_define.js";

export default defineStep({ name: "panel.taken", scope: "run", registrants: "relic.healOnPanelTaken、bookRule" });
