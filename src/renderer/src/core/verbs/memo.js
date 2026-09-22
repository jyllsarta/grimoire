// 動詞: memo。src のスコープの memo に "<family>.<key>" を名前空間にして読み書き (02 原則 7)
function memoScope(state, src) {
  if (src.instance?.memo) return src.instance.memo;
  if (src.scope === "battle" && state.battle) return state.battle.memo;
  if (src.scope === "turn" && state.battle) return state.battle.turnMemo;
  return state.memo;
}

export function readMemo(state, src, key) {
  const ns = `${src.family}.${src.statusKey ?? src.key}`;
  return memoScope(state, src)[ns]?.[key];
}

export function writeMemo(state, src, key, value) {
  const ns = `${src.family}.${src.statusKey ?? src.key}`;
  (memoScope(state, src)[ns] ||= {})[key] = value;
  return value;
}
