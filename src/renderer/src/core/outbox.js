// ============================================================
// Outbox — 一発物 (演出・音の要求) の通知。購読方式 (tricy の改良、01)
//
// core は state には残さず、ここに { type, payload } を流すだけ。
// app が subscribe して Fragments / Sound / StepMover の待ち時間に振り分ける。
// テストは subscribe で全部捕捉する。
//
// イベント種別 (type) の一覧は 03 末尾。payload は type ごと (実装で増減する)。
// ============================================================

const listeners = new Set();

export function emit(type, payload = {}) {
  const event = { type, payload };
  for (const fn of listeners) fn(event);
  return event;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 購読を全部外す (テストの後片付け用)
export function clearSubscribers() {
  listeners.clear();
}

// fn の実行中に流れた一発物を集めて返す
export function collect(fn) {
  const events = [];
  const unsubscribe = subscribe((e) => events.push(e));
  try {
    const result = fn();
    return { result, events };
  } finally {
    unsubscribe();
  }
}
