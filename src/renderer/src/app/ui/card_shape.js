// ============================================================
// 盤面パネルとインベントリのタイルの外形 (tale の CARD_SHAPE / shapePath を移植)。
// 形に意味を持たせる: てき = きば付きの角丸四角 / ぼうぐ = たて (底がとがる) / ぶき = 屋根 (上がとがる) /
// アイテム = 六角 / アビリティ = 石板 / イベント = しおり (上に切れ込み) / 章クリア = とびら (アーチ)
// 盤面 (165x165) と帯 (可変幅 x 96) で同じ生成器 shapePath(shape, w, h) を使う
// ============================================================
const N = (n) => String(Math.round(n * 10) / 10);

function scalePath(d, sx, sy) {
  let cmd = "",
    idx = 0;
  return d.replace(/[MLHVQCZ]|-?\d*\.?\d+/g, (t) => {
    if (/[A-Z]/.test(t)) {
      cmd = t;
      idx = 0;
      return t;
    }
    const isX = cmd === "H" ? true : cmd === "V" ? false : idx % 2 === 0;
    idx++;
    return N(parseFloat(t) * (isX ? sx : sy));
  });
}

const CARD_SHAPE165 = {
  ability: "M10 12 Q11 4 19 4 H149 Q157 4 157 12 L160 142 Q160 154 149 156 L22 160 Q10 161 8 150 Z",
  event: "M4 12 Q4 4 12 4 H70 L82.5 17 L95 4 H153 Q161 4 161 12 V153 Q161 161 153 161 H12 Q4 161 4 153 Z",
  clear: "M4 62 C4 22 40 4 82.5 4 C125 4 161 22 161 62 V153 Q161 161 153 161 H12 Q4 161 4 153 Z",
};

export function shapePath(shape, w, h) {
  const s = Math.min(w, h),
    k = s / 165,
    cx = w / 2,
    cy = h / 2,
    i = 4;
  if (shape === "enemy") {
    const e = 6 * k,
      r = 12 * k,
      fw = 8.5 * k,
      ft = 1.5 * k;
    return (
      `M${N(e + r)} ${N(e)} H${N(cx - fw)} L${N(cx - ft)} 0.5 H${N(cx + ft)} L${N(cx + fw)} ${N(e)} H${N(w - e - r)} Q${N(w - e)} ${N(e)} ${N(w - e)} ${N(e + r)}` +
      ` V${N(cy - fw)} L${N(w - 0.5)} ${N(cy - ft)} V${N(cy + ft)} L${N(w - e)} ${N(cy + fw)} V${N(h - e - r)} Q${N(w - e)} ${N(h - e)} ${N(w - e - r)} ${N(h - e)}` +
      ` H${N(cx + fw)} L${N(cx + ft)} ${N(h - 0.5)} H${N(cx - ft)} L${N(cx - fw)} ${N(h - e)} H${N(e + r)} Q${N(e)} ${N(h - e)} ${N(e)} ${N(h - e - r)}` +
      ` V${N(cy + fw)} L0.5 ${N(cy + ft)} V${N(cy - ft)} L${N(e)} ${N(cy - fw)} V${N(e + r)} Q${N(e)} ${N(e)} ${N(e + r)} ${N(e)} Z`
    );
  }
  if (shape === "armor") {
    const r = 10 * k,
      y0 = 0.594 * h,
      p = 3.5 * k;
    return (
      `M${N(i + r)} ${N(i)} H${N(w - i - r)} Q${N(w - i)} ${N(i)} ${N(w - i)} ${N(i + r)} V${N(y0)}` +
      ` C${N(w - i)} ${N(0.79 * h)} ${N(0.79 * w)} ${N(0.92 * h)} ${N(cx + p)} ${N(h - i + 0.5)} Q${N(cx)} ${N(h - i + 1.5)} ${N(cx - p)} ${N(h - i + 0.5)}` +
      ` C${N(0.21 * w)} ${N(0.92 * h)} ${N(i)} ${N(0.79 * h)} ${N(i)} ${N(y0)} V${N(i + r)} Q${N(i)} ${N(i)} ${N(i + r)} ${N(i)} Z`
    );
  }
  if (shape === "weapon") {
    const r = 10 * k,
      rh = 0.23 * s,
      p = 4.5 * k,
      sx = 10 * k;
    return (
      `M${N(cx - p)} 3.5 Q${N(cx)} 0.5 ${N(cx + p)} 3.5 L${N(w - sx)} ${N(rh)} Q${N(w - i)} ${N(rh * 1.105)} ${N(w - i)} ${N(rh * 1.316)} V${N(h - i - r)}` +
      ` Q${N(w - i)} ${N(h - i)} ${N(w - i - r)} ${N(h - i)} H${N(i + r)} Q${N(i)} ${N(h - i)} ${N(i)} ${N(h - i - r)} V${N(rh * 1.316)} Q${N(i)} ${N(rh * 1.105)} ${N(sx)} ${N(rh)} Z`
    );
  }
  if (shape === "item") {
    const ph = 0.2 * s,
      p = 4.5 * k,
      sx = 8 * k,
      q1 = 3 * k,
      q2 = 9 * k;
    return (
      `M${N(cx - p)} 2.5 Q${N(cx)} 0.5 ${N(cx + p)} 2.5 L${N(w - sx)} ${N(ph)} Q${N(w - i)} ${N(ph + q1)} ${N(w - i)} ${N(ph + q2)} V${N(h - ph - q2)}` +
      ` Q${N(w - i)} ${N(h - ph - q1)} ${N(w - sx)} ${N(h - ph)} L${N(cx + p)} ${N(h - 2.5)} Q${N(cx)} ${N(h - 0.5)} ${N(cx - p)} ${N(h - 2.5)} L${N(sx)} ${N(h - ph)}` +
      ` Q${N(i)} ${N(h - ph - q1)} ${N(i)} ${N(h - ph - q2)} V${N(ph + q2)} Q${N(i)} ${N(ph + q1)} ${N(sx)} ${N(ph)} Z`
    );
  }
  return scalePath(CARD_SHAPE165[shape] || CARD_SHAPE165.event, w / 165, h / 165);
}

// 実体 (装備 / アイテム / アビリティ) の形。武器 = 屋根、防具 = たて
export function entShapeOf(kind, def) {
  return kind === "equipment" ? (def.category === "weapon" ? "weapon" : "armor") : kind;
}

// 盤面パネルの形
export function panelShapeOf(panel, def) {
  if (panel.kind === "chapterClear") return "clear";
  if (panel.kind === "enemy") return "enemy";
  if (panel.kind === "event") return "event";
  return entShapeOf(panel.kind, def);
}
