// イベント効果 gain* の共通形: value = 定義 id を獲得 (空きが無ければ保留)
import { defineEffect } from "../define.js";

export function eventGain(key, kind, table) {
  return defineEffect({
    family: "eventEffect",
    key,
    values: [{ name: "id", type: "int" }],
    refs: [{ index: 0, table }],
    text: { shape: kind },
    use: (ctx, src, eff) => {
      ctx.gain(kind, eff.value, { source: src });
    },
  });
}
