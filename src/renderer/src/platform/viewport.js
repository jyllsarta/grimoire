// ============================================================
// 論理ステージ + CSS zoom (01「画面サイズ」)。k の計算はここ 1 箇所に閉じる。
//   k = min(innerWidth / 1280, innerHeight / 720) × uiScale
//   ステージの論理サイズ = (innerWidth / k, innerHeight / k)。常に 1280x720 以上で、余った方向だけ伸びる。
//   中央の 1280x720 がセーフエリア。--pixel-scale は k × DPR を整数に丸めた倍率 (ドット絵用)。
// ============================================================
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

export function computeViewport(innerWidth, innerHeight, dpr = 1, uiScale = 1) {
  const k = Math.min(innerWidth / BASE_WIDTH, innerHeight / BASE_HEIGHT) * uiScale;
  const width = Math.round(innerWidth / k);
  const height = Math.round(innerHeight / k);
  return {
    k,
    width,
    height,
    safeLeft: Math.round((width - BASE_WIDTH) / 2),
    safeTop: Math.round((height - BASE_HEIGHT) / 2),
    pixelScale: Math.max(1, Math.round(k * dpr)),
  };
}

// ステージ要素に zoom と CSS 変数を当てる。リサイズのたびに呼ぶ。戻り値は viewport
export function applyViewport(stageEl, { uiScale = 1 } = {}) {
  const vp = computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, uiScale);
  stageEl.style.zoom = String(vp.k);
  stageEl.style.width = `${vp.width}px`;
  stageEl.style.height = `${vp.height}px`;
  const root = document.documentElement.style;
  root.setProperty("--stage-width", `${vp.width}px`);
  root.setProperty("--stage-height", `${vp.height}px`);
  root.setProperty("--safe-left", `${vp.safeLeft}px`);
  root.setProperty("--safe-top", `${vp.safeTop}px`);
  root.setProperty("--pixel-scale", String(vp.pixelScale));
  root.setProperty("--zoom", String(vp.k));
  return vp;
}

export function installViewport(stageEl, options) {
  const update = () => applyViewport(stageEl, options);
  update();
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}
