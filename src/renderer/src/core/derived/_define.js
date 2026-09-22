// 派生値の定義 (03「派生値 (内訳付き)」)。1 派生値 1 ファイル。
// defineDerived({
//   name,
//   kind: "number" (flat は加算、mult は乗算、final は加算) / "choice" (後の寄与が値を置き換える) / "flags" (集合に足す)
//   base(ctx, args),
//   standardFlat?(ctx, args) → [{label, value, uid?, defId?}]   モジュールではなくコアが必ず載せる flat の寄与 (ON の武器など)
//   finalize?(value, ctx, args)                                  クランプ
// })
export function defineDerived(def) {
  if (!["number", "choice", "flags"].includes(def.kind)) throw new Error(`defineDerived ${def.name}: kind "${def.kind}" が不正`);
  if (typeof def.base !== "function") throw new Error(`defineDerived ${def.name}: base が関数でない`);
  return Object.freeze({ name: def.name, kind: def.kind, base: def.base, standardFlat: def.standardFlat || null, finalize: def.finalize || null });
}
