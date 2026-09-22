// ============================================================
// フックの解決と実行 (03「処理順の規則」)
//
// 同じステップに並ぶハンドラの順序は次で決まる。他の要因は一切効かない。
//   1. order の昇順 (標準処理はステップ定義の値、効果モジュールは宣言値。省略時 100)
//   2. 同じ order ならレジストリ effects/index.js の並び順 (標準処理はレジストリより前)
//   3. 同じモジュールが複数インスタンスなら uid 昇順
// ============================================================
import { stepOf } from "./index.js";
import { activeSources, moduleOf, uidOf } from "../effects/sources.js";
import { registry } from "../effects/index.js";

// そのステップに並ぶハンドラを順に返す (インスペクタの処理順ビューアもこれを使う)
export function resolveHandlers(state, stepName) {
  const step = stepOf(stepName);
  const handlers = [];
  for (const s of step.standard) {
    handlers.push({
      order: s.order,
      registryIndex: -1,
      uid: 0,
      name: `standard.${s.name}`,
      src: { family: "standard", key: s.name },
      when: null,
      run: s.run,
    });
  }
  for (const src of activeSources(state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const hook = mod.hooks[stepName];
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
export function fireStep(ctx, stepName, payload = {}) {
  ctx.currentStep = stepName;
  for (const h of resolveHandlers(ctx.state, stepName)) {
    if (h.when && !h.when(ctx, h.src, payload)) continue;
    h.run(ctx, h.src, payload);
  }
  ctx.currentStep = null;
}
