// 戦闘パネルの床 (tale floorGridSvg): 正方形グリッドをパースペクティブで台形に変形した SVG。
// 消失点 (cx, vpY) に向かって縦線が収束し、横線は奥ほど詰まる。座標は #battle_field 基準
export const FLOOR = { top: 176, farY: 176, nearY: 336, vpY: 116, cellW: 64, width: 782, cx: 391 };

export function floorGridLines() {
  const { top, farY, nearY, vpY, cellW, width, cx } = FLOOR;
  const h = nearY - top;
  const near = nearY - vpY,
    far = farY - vpY;
  const lines = [];
  for (let n = 0; ; n++) {
    const d = near / (1 + (n * cellW) / near);
    if (d < far) break;
    const y = vpY + d - top;
    lines.push({ x1: 0, y1: y, x2: width, y2: y });
  }
  const ratio = far / near;
  for (let i = -10; i <= 10; i++) {
    const xn = cx + i * cellW,
      xf = cx + i * cellW * ratio;
    if (Math.min(xn, xf) > width || Math.max(xn, xf) < 0) continue;
    lines.push({ x1: xf, y1: 0, x2: xn, y2: h });
  }
  return { lines, width, height: h, top };
}
