// canAct: 攻撃ボタン (手番を取れるか)。寄与: status.sleep (手番スキップ、zzz 表示)
import { definePermission } from "./_define.js";

export default definePermission({ name: "canAct", base: () => null });
