// action.equipToggle: 装備 ON/OFF の解決後 (payload: { entity, active })
import { defineStep } from "../_define.js";

export default defineStep({ name: "action.equipToggle", scope: "run", registrants: "passive.mustWithOtherWeapon (自動 OFF)" });
