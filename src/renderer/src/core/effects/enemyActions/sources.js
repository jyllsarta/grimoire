// enemyAction family の発生源: いま戦っている敵の「いまのルーチン」のアクション。
// blitz / pierce のようなマーカーが turnOrder / enemyStrikeFlags に寄与するための列挙 (use はステップ enemy.action が呼ぶ)
import { master } from "../../master/index.js";
import { battlePanel } from "../../domain/battle.js";
import { currentActions } from "../../domain/board.js";

export function enumerate(state, out) {
  const panel = battlePanel(state);
  // 勝利後はパネルが chapterClear に変わっている (closeBattle 待ち) ので、敵でなければ何も無い
  if (!panel || panel.kind !== "enemy" || !panel.enemy) return;
  const def = master.get("enemies", panel.defId);
  for (const action of currentActions(panel)) {
    out.push({ family: "enemyAction", key: action.type, def, action, values: [action.value ?? 0] });
  }
}
