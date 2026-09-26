// 動詞: gainRelic (レリックの獲得の横断規則)。同じ defId は 1 個まで。所持したら relic.gained を発火 (R3 Q15: 取得時の即時効果はそこに登録)
export function gainRelic(ctx, defId, { source = null } = {}) {
  const def = ctx.master.get("relics", defId);
  const state = ctx.state;
  if (state.relics.some((r) => r.defId === defId)) return null;
  const relic = { uid: ctx.uid(), defId, memo: {} };
  state.relics.push(relic);
  ctx.emit("relicGain", { defId, uid: relic.uid, source: source?.family ?? null });
  ctx.fire("relic.gained", { relic, def, source });
  return relic;
}
