// 動詞: heal。上限は maxHp。実回復 0 でも「回復で消える」ステート (flags.curedByHeal) は全部消える
import { master } from "../master/index.js";
import { registry } from "../effects/index.js";
import { describeSource } from "./_source.js";

function statusModule(key) {
  const def = master.byKey("statuses", key);
  return registry.find("status", def.effect || def.key);
}

export function heal(ctx, n, { source = null } = {}) {
  const p = ctx.state.player;
  const maxHp = ctx.derive("maxHp");
  const before = p.hp;
  p.hp = Math.min(maxHp, p.hp + Math.max(0, n));
  const healed = p.hp - before;
  ctx.emit("heal", { amount: n, healed, source: describeSource(source) });
  const cured = [];
  p.statuses = p.statuses.filter((s) => {
    if (statusModule(s.key)?.flags?.curedByHeal) {
      cured.push(s.key);
      return false;
    }
    return true;
  });
  for (const key of cured) {
    statusModule(key)?.onExpire?.(ctx, { family: "status", key, statusKey: key, side: "player" });
    ctx.emit("poisonCured", { key });
  }
  return healed;
}
