// entity.gained: 実体がインベントリに入った (回収 / 獲得 / 開始品 / 保留解決。payload: { entity, source })
import { defineStep } from "../_define.js";

export default defineStep({ name: "entity.gained", scope: "run", registrants: "bookRule.foodRot (memo 初期化)" });
