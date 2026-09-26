// イベントの選択肢 (05 events / eventChoices)。条件付き選択肢 (FTL の青選択肢) は choiceCondition モジュールが判定する
import { registry } from "../effects/index.js";

// 選択肢を出せるか (条件が無ければ常に true)。UI は伏せ、コマンド chooseEvent は reason choiceLocked で拒否する
export function choiceAvailable(ctx, choice) {
  const cond = choice.condition;
  if (!cond || !cond.type) return true;
  const mod = registry.find("choiceCondition", cond.type);
  if (!mod) throw new Error(`eventChoices ${choice.id}: 不明な condition.type "${cond.type}"`);
  return mod.check(ctx, { family: "choiceCondition", key: cond.type, def: choice, values: cond.values || [] }) === true;
}
