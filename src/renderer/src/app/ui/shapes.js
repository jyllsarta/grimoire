// ============================================================
// 行動・効果・ステートの図形 (SVG)。tale の SHAPE_SVG を移植し、grimoire のステート (回避 / 好調 / 固有バステ / 敵シールド) を足した。
// 中央に数値を載せる前提なので中身にディティールを置かず、輪郭と色で識別する (tale のトンマナ)。
//   攻撃族 = main2 (金) / 防御族 = positive1 (青) / ライフ族 = accent3 (緑) / 害族 = negative1 (桃) / 中立 = base2 / white0
// 図形は仮で、いつか描き直す (01)。
// ============================================================
const STROKE = `stroke="var(--color-base5)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

// ひし形: 頂点を少しだけ伸ばし、頂点の近くの辺に小さなとげを 1 つずつ
const DIAMOND_PTS = (() => {
  const edge = [
    [24, -1],
    [27.8, 5],
    [31, 8.2],
    [32.6, 6.6],
    [43, 17.5],
    [49, 24],
  ];
  const pts = [];
  for (let q = 0; q < 4; q++) {
    for (const [x, y] of edge.slice(0, -1)) {
      const dx = x - 24,
        dy = y - 24;
      let rx = dx,
        ry = dy;
      for (let i = 0; i < q; i++) {
        const t = rx;
        rx = -ry;
        ry = t;
      }
      pts.push([24 + rx, 24 + ry]);
    }
  }
  return pts;
})();
const polyPath = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
const DIAMOND = polyPath(DIAMOND_PTS);

export const SHAPE_FILL = {
  attack: "var(--color-main2)",
  defense: "var(--color-positive1)",
  life: "var(--color-accent3)",
  harm: "var(--color-negative1)",
  harm2: "var(--color-negative2)",
  down: "var(--color-main4)",
  neutral: "var(--color-base2)",
  badge: "var(--color-white0)",
  ice: "var(--color-positive0)",
};

const F = SHAPE_FILL;
const rivets = `<circle cx="9.5" cy="9.5" r="1.7" fill="var(--color-base5)" opacity="0.6"/><circle cx="38.5" cy="9.5" r="1.7" fill="var(--color-base5)" opacity="0.6"/><circle cx="9.5" cy="38.5" r="1.7" fill="var(--color-base5)" opacity="0.6"/><circle cx="38.5" cy="38.5" r="1.7" fill="var(--color-base5)" opacity="0.6"/>`;

export const SHAPE_SVG = {
  attack: `<path d="${DIAMOND}" fill="${F.attack}" ${STROKE}/>`,
  // 貫通: 盾が真ん中で割れて左右に傾く
  pierce: `<g transform="rotate(-4 24 47)"><path d="M23 1 L20 5 L6 7 L6 30 C6 39 12.5 45 22 47 L21.5 47.6 L23 39 L19 30 L25 20 L21 11 Z" fill="${F.defense}" ${STROKE}/></g>
    <g transform="rotate(4 24 47)"><path d="M25 1 L28 5 L42 7 L42 30 C42 39 35.5 45 26 47 L23.5 47.6 L25 39 L21 30 L27 20 L23 11 Z" fill="${F.defense}" ${STROKE}/></g>`,
  blitz: `<path d="M30 2 L8 27 L21 26 L16 46 L41 18 L28 19 Z" fill="${F.attack}" ${STROKE}/>`,
  block: `<path d="M10 5 H38 L43 10 V38 L38 43 H10 L5 38 V10 Z" fill="${F.defense}" ${STROKE}/>${rivets}`,
  shield: `<path d="M24 1 L28 5 L42 7 L42 30 C42 39 35 45 24 47 C13 45 6 39 6 30 L6 7 L20 5 Z" fill="${F.defense}" ${STROKE}/>
    <path d="M6 7 L9.5 3.5 M42 7 L38.5 3.5" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  // 敵のシールド: 同じ盾を害族の色で (プレイヤーの水色と区別)
  enemyShield: `<path d="M24 1 L28 5 L42 7 L42 30 C42 39 35 45 24 47 C13 45 6 39 6 30 L6 7 L20 5 Z" fill="${F.harm2}" ${STROKE}/>
    <path d="M6 7 L9.5 3.5 M42 7 L38.5 3.5" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  poison: `<path d="M20.5 4 Q24 0.5 27.5 4 C35 12 42 19 42 27 A18 18 0 0 1 6 27 C6 19 13 12 20.5 4 Z" fill="${F.harm}" ${STROKE}/>`,
  powerDown: `<path d="M5 5 L43 5 L43 38 L27 46 Q24 47.5 21 46 L5 38 Z" fill="${F.down}" ${STROKE}/>
    <path d="M8 9 L5 5 M40 9 L43 5" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  powerUp: `<path d="M21 2 Q24 0.5 27 2 L43 10 L43 43 L5 43 L5 10 Z" fill="${F.attack}" ${STROKE}/>
    <path d="M8 39 L5 43 M40 39 L43 43" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  heal: `<path d="M24 45 C10 34 3 27 3 17 A10 10 0 0 1 24 12 A10 10 0 0 1 45 17 C45 27 38 34 24 45 Z" fill="${F.life}" ${STROKE}/>`,
  rest: `<path d="M4 4 H44 V10 L36 38 H44 V44 H4 V38 L12 10 H4 Z" fill="${F.neutral}" ${STROKE}/>`,
  // ---- 共通バステ ----
  paralyze: `<path d="M24 2 L42 12.5 L42 35.5 L24 46 L6 35.5 L6 12.5 Z" fill="${F.harm}" ${STROKE}/>
    <path d="M2 20 L5 18 M2 28 L5 30 M46 20 L43 18 M46 28 L43 30" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  heart: `<path d="M24 45 C10 34 3 27 3 17 A10 10 0 0 1 22.5 11.5 L20.5 15.5 L25.5 18.5 L22 22 L25.5 11.5 A10 10 0 0 1 45 17 C45 27 38 34 24 45 Z" fill="${F.harm}" ${STROKE}/>`,
  nebaneba: `<path d="M8 8 Q24 0 40 8 Q46 14 44 24 Q43 33 40 36 Q38 46 35 40 Q33 34 31 37 Q29 46 25 39 Q22 33 19 37 Q16 47 13 38 Q8 32 6 22 Q4 13 8 8 Z" fill="${F.harm}" ${STROKE}/>`,
  // 眠り: 丸い月のシルエット
  sleep: `<path d="M30 3 A21 21 0 1 0 45 32 A15 15 0 0 1 30 3 Z" fill="${F.harm}" ${STROKE}/>`,
  // 混乱: ぐるぐるの渦 (角丸の四角の中に太い渦線)
  confusion: `<path d="M12 4 H36 Q44 4 44 12 V36 Q44 44 36 44 H12 Q4 44 4 36 V12 Q4 4 12 4 Z" fill="${F.harm}" ${STROKE}/>
    <path d="M24 14 A10 10 0 1 1 14 24 A6 6 0 1 0 20 18" fill="none" stroke="var(--color-base5)" stroke-width="2.5" stroke-linecap="round"/>`,
  crossBreak: `<g transform="rotate(45 24 24)"><path d="M20 3 H28 V20 H45 V28 H28 V45 H20 V28 H3 V20 H20 Z" fill="${F.harm2}" ${STROKE}/></g>`,
  clothBreakHalf: `<path d="M8 4 H40 V26 L34 31 L37 38 L28 36 L24 44 L20 36 L12 40 L14 30 L8 26 Z" fill="${F.harm}" ${STROKE}/>`,
  clothBreakFull: `<path d="M8 4 H40 V18 L35 22 L40 30 L32 30 L34 40 L26 34 L22 44 L18 34 L10 40 L13 28 L8 24 Z" fill="${F.harm2}" ${STROKE}/>`,
  clothSpecial1: `<path d="M24 2 L30 16 L46 18 L34 29 L38 45 L24 37 L10 45 L14 29 L2 18 L18 16 Z" fill="${F.badge}" ${STROKE}/>`,
  // ---- 良性ステート ----
  abilityPower: `<path d="M24 1 L33 15 L47 24 L33 33 L24 47 L15 33 L1 24 L15 15 Z" fill="${F.attack}" ${STROKE}/>
    <path d="M8 8 L11 11 M40 8 L37 11 M8 40 L11 37 M40 40 L37 37" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  // 回避: 羽 (防御族の青)
  evade: `<path d="M6 40 C6 20 18 6 44 4 C40 14 38 22 30 30 C24 36 16 40 6 40 Z" fill="${F.defense}" ${STROKE}/>
    <path d="M10 37 C18 28 26 20 40 8" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  // 好調: 上向きの五角形に光の筋 (攻撃族)
  focus: `<path d="M21 2 Q24 0.5 27 2 L43 10 L43 43 L5 43 L5 10 Z" fill="${F.attack}" ${STROKE}/>
    <path d="M12 38 L18 30 M30 30 L36 38" fill="none" stroke="var(--color-base5)" stroke-width="2" stroke-linecap="round"/>`,
  // ---- デスサイズちゃん固有 ----
  // 結晶化: 六角の結晶 (氷色)
  crystal: `<path d="M24 1 L44 13 L44 35 L24 47 L4 35 L4 13 Z" fill="${F.ice}" ${STROKE}/>
    <path d="M24 1 V47 M4 13 L44 35 M44 13 L4 35" fill="none" stroke="var(--color-base5)" stroke-width="1.5" opacity="0.45"/>`,
  // 体温上昇: 炎 (害族)
  fever: `<path d="M24 2 C30 12 40 16 40 30 A16 16 0 0 1 8 30 C8 22 14 18 16 12 C18 18 22 20 24 18 C26 14 24 8 24 2 Z" fill="${F.harm}" ${STROKE}/>`,
  // リーサルサイズ: 鎌 (攻撃族)
  lethal: `<path d="M14 46 L20 6 L26 6 L22 32 Z" fill="${F.attack}" ${STROKE}/>
    <path d="M22 8 C34 4 44 10 46 22 C40 14 32 12 24 16 Z" fill="${F.attack}" ${STROKE}/>`,
  // 過酷さ (本の要求): 本
  harshness: `<path d="M8 6 H22 Q24 6 24 8 V42 Q24 40 22 40 H8 Z M40 6 H26 Q24 6 24 8 V42 Q24 40 26 40 H40 Z" fill="${F.harm2}" ${STROKE}/>`,
  // コイン (菱形の宝石)
  coin: `<path d="M24 3 L45 24 L24 45 L3 24 Z" fill="${F.attack}" ${STROKE}/><path d="M24 12 L36 24 L24 36 L12 24 Z" fill="none" stroke="var(--color-base5)" stroke-width="1.5" opacity="0.5"/>`,
  // イベント / 敵 / レリック / 衣装 (図形バッジ用の汎用)
  event: `<path d="M8 4 H40 V44 L24 34 L8 44 Z" fill="${F.badge}" ${STROKE}/>`,
  enemy: `<path d="M8 8 H40 Q44 8 44 12 V34 Q44 38 40 38 H34 L30 46 L26 38 H22 L18 46 L14 38 H8 Q4 38 4 34 V12 Q4 8 8 8 Z" fill="${F.harm}" ${STROKE}/>`,
  costume: `<path d="M16 4 L24 10 L32 4 L44 12 L38 20 L36 18 V44 H12 V18 L10 20 L4 12 Z" fill="${F.badge}" ${STROKE}/>`,
  lose: `<path d="M8 8 H40 Q44 8 44 12 V40 Q44 44 40 44 H8 Q4 44 4 40 V12 Q4 8 8 8 Z" fill="${F.neutral}" ${STROKE}/><path d="M14 14 L34 38 M34 14 L14 38" fill="none" stroke="var(--color-negative1)" stroke-width="4" stroke-linecap="round"/>`,
  relic: `<path d="M24 2 L30 16 L46 18 L34 29 L38 45 L24 37 L10 45 L14 29 L2 18 L18 16 Z" fill="${F.attack}" ${STROKE}/>`,
  status: `<path d="M24 2 L44 13 L44 35 L24 47 L4 35 L4 13 Z" fill="${F.harm}" ${STROKE}/>`,
  wings: `<path d="M6 40 C6 20 18 6 44 4 C40 14 38 22 30 30 C24 36 16 40 6 40 Z" fill="${F.badge}" ${STROKE}/>`,
  slot: `<path d="M8 14 H40 Q44 14 44 18 V40 Q44 44 40 44 H8 Q4 44 4 40 V18 Q4 14 8 14 Z" fill="${F.defense}" ${STROKE}/><path d="M16 14 V10 Q16 4 24 4 Q32 4 32 10 V14" fill="none" stroke="var(--color-base5)" stroke-width="3"/>`,
  life: `<path d="M24 45 C10 34 3 27 3 17 A10 10 0 0 1 24 12 A10 10 0 0 1 45 17 C45 27 38 34 24 45 Z" fill="${F.life}" ${STROKE}/>`,
  selfHarm: `<path d="M4 4 H44 V10 L36 38 H44 V44 H4 V38 L12 10 H4 Z" fill="${F.neutral}" ${STROKE}/>`,
  ability: `<path d="M24 1 L33 15 L47 24 L33 33 L24 47 L15 33 L1 24 L15 15 Z" fill="${F.life}" ${STROKE}/>`,
  item: `<path d="M12 4 H36 Q44 4 44 12 V36 Q44 44 36 44 H12 Q4 44 4 36 V12 Q4 4 12 4 Z" fill="${F.defense}" ${STROKE}/>`,
  equipment: `<path d="${DIAMOND}" fill="${F.attack}" ${STROKE}/>`,
};

// 数値の色: 基本は暗色。濃い塗りだけ白
export const SHAPE_LIGHT_TEXT = new Set(["clothBreakFull", "rest", "selfHarm", "enemyShield", "harshness", "lose"]);

// statuses.key → 図形 (チップ用)。effect モジュールの text.shape ではなくここで一元管理 (app 側の表)
export const STATUS_SHAPE = {
  poison: "poison",
  sleep: "sleep",
  paralyze: "paralyze",
  arousal: "heart",
  sticky: "nebaneba",
  confusion: "confusion",
  power: "powerUp",
  abilityDamage: "abilityPower",
  evade: "evade",
  focus: "focus",
  ds_crystal: "crystal",
  ds_fever: "fever",
  half: "clothBreakHalf",
  full: "clothBreakFull",
  special1: "clothSpecial1",
  powerDelta: "powerUp",
  blockDelta: "block",
};

// 敵アクション → { shape, text }。text が null なら記号だけ。value は派生 enemyAttack で補正済みの値を渡す
export function actionShape(action, value) {
  if (!action) return { shape: "rest", text: "…" };
  switch (action.type) {
    case "attack":
      return { shape: "attack", text: value ?? action.value ?? 0 };
    case "block":
      return { shape: "block", text: action.value ?? 0 };
    case "shield":
      return { shape: "enemyShield", text: action.value ?? 0 };
    case "pierce":
      return { shape: "pierce", text: null };
    case "blitz":
      return { shape: "blitz", text: null };
    case "rest":
      return { shape: "rest", text: "…" };
    case "selfHarm":
      return { shape: "rest", text: `-${action.value ?? 0}` };
    case "crossBreak":
      return { shape: "crossBreak", text: null };
    default:
      // statuses.key (共通 / 固有バステの付与)
      return { shape: STATUS_SHAPE[action.type] || "status", text: action.value ?? 1 };
  }
}
