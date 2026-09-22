// インスタンス (パネル、実体、レリック) の連番。10001 から (知らない値を見たとき uid と判別できるように)
export const UID_START = 10001;

export function nextUid(state) {
  const uid = state.uidNext;
  state.uidNext += 1;
  return uid;
}

export function isUid(value) {
  return Number.isInteger(value) && value >= UID_START;
}
