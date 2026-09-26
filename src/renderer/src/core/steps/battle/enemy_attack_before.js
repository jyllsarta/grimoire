// enemy.attack.before: 敵アクション attack が 1 発撃つ直前 (payload: { action, negated })。
// ハンドラが payload.negated = true にするとその 1 発は無かったことになる (防具摩耗・パリィ・眠り解除のどれにも関わらない)。
// 回避 (status.evade) がここで 1 スタック消費する。run スコープ (敵アクションの解決の中で同期に発火)
import { defineStep } from "../_define.js";

export default defineStep({ name: "enemy.attack.before", scope: "run", registrants: "status.evade (100: 1 スタック消費して negated)" });
