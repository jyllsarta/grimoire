// 許可の定義 (03「許可」)。1 許可 1 ファイル。base(ctx, args) が理由キーを返せば即不許可、次に効果モジュールの permissions を order 順に見る
export function definePermission(def) {
  if (typeof def.base !== "function") throw new Error(`definePermission ${def.name}: base が関数でない`);
  return Object.freeze({ name: def.name, base: def.base });
}
