// スターパレット効果の共通形。派生値 name に ±values[0] を flat で寄与する
import { defineEffect } from "../define.js";

export function starDelta(key, derivedName, sign, { min = 1, shape = null } = {}) {
  return defineEffect({
    family: "star",
    key,
    values: [{ name: "amount", type: "int", min }],
    text: { shape, sign },
    modifiers: {
      [derivedName]: { stage: "flat", order: 200, apply: (ctx, src) => ({ label: `star.${key}`, value: sign * src.values[0] }) },
    },
  });
}

// 「持ってスタート」系。派生リスト startEntities に 1 件足す
export function starStartEntity(key, kind, table) {
  return defineEffect({
    family: "star",
    key,
    values: [{ name: "id", type: "int" }],
    refs: [{ index: 0, table }],
    text: { shape: kind },
    lists: {
      startEntities: { order: 200, provide: (ctx, src) => [{ kind, defId: src.values[0] }] },
    },
  });
}
