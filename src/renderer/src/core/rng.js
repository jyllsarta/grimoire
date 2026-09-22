// ============================================================
// 決定的乱数 (xoshiro128**)。状態は state.rng = { seed, s: [u32 x4] } に置く (02)。
// core では Math.random を使わない。全部の抽選がここを進める。
// ============================================================

// splitmix32: seed (int) から 4 つの u32 内部状態を作る
function splitmix32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export function seedToState(seed) {
  const next = splitmix32(seed);
  const s = [next(), next(), next(), next()];
  // 全部 0 は xoshiro の不動点なので避ける
  if (s.every((v) => v === 0)) s[0] = 1;
  return s;
}

export function createRng(seed) {
  return { seed: seed | 0, s: seedToState(seed | 0) };
}

const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;

// xoshiro128** を 1 回進めて u32 を返す (rng.s を書き換える)
export function nextU32(rng) {
  const s = rng.s;
  const result = Math.imul(rotl(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0;
  const t = (s[1] << 9) >>> 0;
  s[2] = (s[2] ^ s[0]) >>> 0;
  s[3] = (s[3] ^ s[1]) >>> 0;
  s[1] = (s[1] ^ s[2]) >>> 0;
  s[0] = (s[0] ^ s[3]) >>> 0;
  s[2] = (s[2] ^ t) >>> 0;
  s[3] = rotl(s[3], 11);
  return result;
}

// [0, 1) の浮動小数
export function nextFloat(rng) {
  return nextU32(rng) / 4294967296;
}

// [0, n) の整数。n <= 0 なら 0
export function randInt(rng, n) {
  if (!(n > 0)) return 0;
  return Math.floor(nextFloat(rng) * n);
}

export function pick(rng, list) {
  if (!list || list.length === 0) return undefined;
  return list[randInt(rng, list.length)];
}

// Fisher-Yates。配列をその場でシャッフルして返す
export function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

// 重み付き抽選。weights[i] > 0 のものだけ候補。全部 0 なら undefined
export function weightedPick(rng, list, weights) {
  const total = weights.reduce((a, w) => a + Math.max(0, w), 0);
  if (total <= 0) return undefined;
  let r = nextFloat(rng) * total;
  for (let i = 0; i < list.length; i++) {
    const w = Math.max(0, weights[i]);
    if (r < w) return list[i];
    r -= w;
  }
  return list[list.length - 1];
}
