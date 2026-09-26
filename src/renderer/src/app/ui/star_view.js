// ============================================================
// スターパレットの見た目の表 (tale の STAR_ICON / starBaseSvg)。ロジックは core/star/palette.js
// ============================================================

// effectType → 図形 (app/ui/shapes.js の kind)
export const STAR_EFFECT_SHAPE = {
  maxHpPlus: "life",
  maxHpMinus: "life",
  powerPlus: "attack",
  powerMinus: "powerDown",
  slotPlus: "slot",
  slotMinus: "slot",
  enemyHpPlus: "enemy",
  enemyHpMinus: "enemy",
  startHpMinus: "life",
  badDurationPlus: "status",
  startRelic: "relic",
  startEquipment: "equipment",
  startItem: "item",
  startAbility: "ability",
  chapterEnemy: "enemy",
  misfortuneCandidate: "event",
};

export function starShapeOf(node) {
  if (node.kind === "origin") return "wings";
  if (node.kind === "gate") return "lose";
  return STAR_EFFECT_SHAPE[node.effectType] || "status";
}

// 台座: 原点 = 8 芒星 / 通常 = 六角 / ゲート = 菱形 (viewBox 0 0 64 64)
export function starBasePath(kind) {
  if (kind === "origin") {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 30 : 17;
      const a = (Math.PI / 8) * i - Math.PI / 2;
      pts.push(`${(32 + r * Math.cos(a)).toFixed(1)} ${(32 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(" L")} Z`;
  }
  if (kind === "gate") return "M32 3 L61 32 L32 61 L3 32 Z";
  return "M32 3 L57 17.5 L57 46.5 L32 61 L7 46.5 L7 17.5 Z";
}

export function deltaClass(delta) {
  return delta < 0 ? "neg" : delta > 0 ? "pos" : "";
}

export function signedDelta(delta) {
  return `${delta > 0 ? "+" : ""}${delta}`;
}
