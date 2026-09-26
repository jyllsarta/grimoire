// canFlee: にげる を押せるか。寄与: status.ds_crystal (結晶化: 不許可、UI は逃げるボタンにテクスチャ)、status.sleep
import { definePermission } from "./_define.js";

export default definePermission({ name: "canFlee", base: () => null });
