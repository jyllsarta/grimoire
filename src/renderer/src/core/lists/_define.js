// 派生リストの定義 (03「派生リスト」)。1 リスト 1 ファイル。base(ctx, args) の配列に、効果モジュールの lists.provide を order 順で連結する
export function defineList(def) {
  if (typeof def.base !== "function") throw new Error(`defineList ${def.name}: base が関数でない`);
  return Object.freeze({ name: def.name, base: def.base });
}
