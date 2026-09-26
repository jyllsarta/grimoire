// canRepairCostume: 衣装を修復 (half / full → normal) できるか。寄与: status.ds_fever (体温上昇: 不許可)。
// 修復アイテム (tale の repairCostume) を移植するときはこの許可を通す
import { definePermission } from "./_define.js";

export default definePermission({ name: "canRepairCostume", base: () => null });
