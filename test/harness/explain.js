// 失敗時に直前の state と outbox の一発物をダンプする (08)
export function explain({ state, events = [], commands = [], error = null, invariants = [] }) {
  const lines = [];
  if (error) lines.push(`error: ${error.stack || error.message || error}`);
  if (invariants.length) lines.push(`invariants:\n  ${invariants.join("\n  ")}`);
  const last = commands.slice(-8).map((c) => `${c.name}(${JSON.stringify(c.args)}) → ${JSON.stringify(c.result)}`);
  if (last.length) lines.push(`last commands:\n  ${last.join("\n  ")}`);
  const ev = events.slice(-12).map((e) => `${e.type} ${JSON.stringify(e.payload)}`);
  if (ev.length) lines.push(`last events:\n  ${ev.join("\n  ")}`);
  if (state) {
    lines.push(
      `state: phase ending=${state.progress?.ending} chapter=${state.progress?.chapterIndex} hp=${state.player?.hp} coin=${state.wallet?.coin} battle=${state.battle ? `${state.battle.step} turn=${state.battle.turn} result=${state.battle.result}` : "null"}`,
    );
  }
  return lines.join("\n");
}
