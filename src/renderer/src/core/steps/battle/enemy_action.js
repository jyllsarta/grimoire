// enemy.action: ルーチンの actions[cursor] を 1 つ解決する。enemyAction モジュール、または statuses.key なら付与
import { defineStep, std } from "../_define.js";
import { master } from "../../master/index.js";
import { currentActions } from "../../domain/board.js";
import { registry } from "../../effects/index.js";

export default defineStep({
  name: "enemy.action",
  scope: "battle",
  next: (b, enemy, actions) => {
    if (b.result) return "enemy.act.after";
    return b.cursor < actions.length ? "enemy.action" : "enemy.act.after";
  },
  registrants: "(enemyAction モジュールの use)",
  standard: [
    std("resolve", 500, (ctx) => {
      const b = ctx.state.battle;
      const panel = ctx.enemyPanel();
      const actions = currentActions(panel);
      const action = actions[b.cursor];
      b.cursor += 1;
      if (!action) return;
      const src = { family: "enemyAction", key: action.type, def: master.get("enemies", panel.defId), action };
      const mod = registry.find("enemyAction", action.type);
      if (mod) {
        mod.use(ctx, src, action);
      } else if (master.findByKey("statuses", action.type)) {
        ctx.applyStatus("player", action.type, action.value ?? 1, { source: src });
      } else {
        throw new Error(`enemyActions: 不明な type "${action.type}" (enemy ${panel.defId})`);
      }
    }),
  ],
});
