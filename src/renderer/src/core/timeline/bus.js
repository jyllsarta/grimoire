// ============================================================
// フックの解決と実行 (03「処理順の規則」)
//
// 同じステップに並ぶハンドラの順序は次で決まる。他の要因は一切効かない。
//   1. order の昇順 (標準処理は表の値、効果モジュールは宣言値。省略時 100)
//   2. 同じ order ならレジストリ effects/index.js の並び順 (標準処理は -1 = 常にレジストリより前扱いではなく、order で並ぶ)
//   3. 同じモジュールが複数インスタンスなら uid 昇順
// ============================================================

import { STANDARD } from "./standard.js";
import { activeSources, moduleOf, uidOf } from "./sources.js";
import { registry } from "../effects/index.js";

// そのステップに並ぶハンドラを順に返す (インスペクタの処理順ビューアもこれを使う)
export function resolveHandlers(state, step) {
  const handlers = [];
  for (const std of STANDARD[step] || []) {
    handlers.push({
      order: std.order,
      registryIndex: -1,
      uid: 0,
      name: `standard.${std.name}`,
      src: { family: "standard", key: std.name },
      when: null,
      run: std.run,
    });
  }
  for (const src of activeSources(state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const hook = mod.hooks[step];
    if (!hook) continue;
    handlers.push({
      order: hook.order,
      registryIndex: registry.indexOf(mod),
      uid: uidOf(src),
      name: `${src.family}.${src.key}`,
      src: { ...src, module: mod },
      when: hook.when,
      run: hook.run,
    });
  }
  handlers.sort((a, b) => a.order - b.order || a.registryIndex - b.registryIndex || a.uid - b.uid);
  return handlers;
}

// ステップを 1 つ実行する。ラン・章スコープはコマンドの中から、バトルのステップは advance から呼ぶ
export function fireStep(ctx, step, payload = {}) {
  ctx.currentStep = step;
  for (const h of resolveHandlers(ctx.state, step)) {
    if (h.when && !h.when(ctx, h.src, payload)) continue;
    h.run(ctx, h.src, payload);
  }
  ctx.currentStep = null;
}
