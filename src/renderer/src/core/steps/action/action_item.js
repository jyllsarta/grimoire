// action.item: アイテム使用 (フリーアクション) の解決後 (payload: { entity, def })
import { defineStep } from "../_define.js";

export default defineStep({ name: "action.item", scope: "run", registrants: "(なし)" });
