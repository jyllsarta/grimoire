// ============================================================
// ステップの定義 (03「ステップとは」)。1 ステップ 1 ファイル (xqueens の phase_*.js と同じ粒度)。
//
// defineStep({
//   name,        "<scope>.<moment>"
//   scope,       "run" (コマンドの中で同期に発火) / "battle" (battle.step の値になり、advance が 1 つ進める)
//   settle,      battle: 末尾で result が立っていれば victory / defeat に差し替える
//   input,       battle: 入力待ち (select)。advance しない
//   terminal,    battle: 終端 (battle.end)。closeBattle を待つ
//   next(battle, enemy, actions),  battle: result を見ない素の「次」
//   standard: [{ name, order, run(ctx, src, payload) }]   コアが必ずやること。order は公開され、効果はその前後に付ける
//   registrants: "..."   典型的な登録者 (ドキュメント)
// })
// ============================================================
export function defineStep(def) {
  // 名前は <scope>.<moment>。入力待ちの select だけは 03 の表どおり 1 語
  if (typeof def.name !== "string" || (!def.name.includes(".") && def.name !== "select"))
    throw new Error(`defineStep: name "${def.name}" が <scope>.<moment> でない`);
  if (!["run", "battle"].includes(def.scope)) throw new Error(`defineStep ${def.name}: scope "${def.scope}" が不正`);
  for (const s of def.standard || []) {
    if (typeof s.name !== "string" || typeof s.order !== "number" || typeof s.run !== "function") {
      throw new Error(`defineStep ${def.name}: standard の要素は { name, order, run } (${JSON.stringify(Object.keys(s))})`);
    }
  }
  if (def.scope === "battle" && typeof def.next !== "function") throw new Error(`defineStep ${def.name}: battle ステップは next が要る`);
  return Object.freeze({
    name: def.name,
    scope: def.scope,
    settle: !!def.settle,
    input: !!def.input,
    terminal: !!def.terminal,
    next: def.next || null,
    standard: [...(def.standard || [])].sort((a, b) => a.order - b.order),
    registrants: def.registrants || "",
  });
}

export function std(name, order, run) {
  return { name, order, run };
}
