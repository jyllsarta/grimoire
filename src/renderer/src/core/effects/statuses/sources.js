// status family の発生源: player の共通ステートと固有バステ、両側のバトルバフ、敵側のステート
import { master } from "../../master/index.js";
import { battleEnemy } from "../../domain/battle.js";

function statusSrc(entry, side, extra = {}) {
  const def = master.byKey("statuses", entry.key);
  return { family: "status", key: def.effect || def.key, def, side, value: entry.value, statusKey: entry.key, ...extra };
}

export function enumerate(state, out) {
  for (const s of state.player.statuses) out.push(statusSrc(s, "player"));
  if (state.player.unique) {
    const def = master.byKey("statuses", state.player.unique.key);
    out.push({
      family: "status",
      key: def.effect || def.key,
      def,
      side: "player",
      value: state.player.unique.turns,
      statusKey: def.key,
      unique: true,
    });
  }
  if (state.battle) {
    for (const b of state.battle.buffs) out.push(statusSrc(b, "player", { turns: b.turns, buff: true }));
  }
  const enemy = battleEnemy(state);
  if (enemy) {
    for (const s of enemy.statuses) out.push(statusSrc(s, "enemy"));
    for (const b of enemy.buffs) out.push(statusSrc(b, "enemy", { turns: b.turns, buff: true }));
  }
}
