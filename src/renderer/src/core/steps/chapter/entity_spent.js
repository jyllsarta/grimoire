// entity.spent: 使い切り・破壊で実体が消えた (payload: { entity, kind })。recharge(exhaust) は動詞 spend が進める
import { defineStep } from "../_define.js";

export default defineStep({ name: "entity.spent", scope: "run", registrants: "passive.exhaustAddEquipment (400: 消える前に代替を得る)" });
