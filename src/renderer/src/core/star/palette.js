// ============================================================
// スターパレットのコア (07 StarPalette、R3 Q3)。純関数。画面 (M3) と newRun がこれを使う。
//   マスタ: starNodes (origin / node / gate、fromIds が道)、starPresets (難易度ボタン)
//   進行データ: progress.characters[cid] (06) = { star: {activeNodeIds, lastPreset}, totalCrowns, records: {bookId: {...}} }
//   ラン: state.star = snapshot(...) (02)。ラン中固定
// 規則:
//   - origin は常に有効。node は「有効 かつ 原点から有効な node と開いた gate だけを通って到達できる」ときだけ効く (normalize)
//   - gate は自分では効果を持たない通路。gateType / gateValue を進行データが満たすと開く
//   - ON にするときは、いちばん近い有効な道から一斉に有効化する (toggleNode)。OFF にすると先が連鎖で無効になる (normalize)
//   - プリセット適用は「現在の有効ノードを全部捨ててからプリセットを有効化」(R2 Q34)。到達できないノードは有効にならない
// ============================================================
import { master } from "../master/index.js";

export function nodesOf(characterId) {
  return master.where("starNodes", "characterId", characterId);
}

export function originOf(characterId) {
  const origin = nodesOf(characterId).find((n) => n.kind === "origin");
  if (!origin) throw new Error(`starNodes に characterId=${characterId} の origin が無い`);
  return origin;
}

// ゲートが開いているか。progress は 06 の characterProgress (無ければ全部閉じている扱い)
export function gateOpen(node, progress) {
  if (node.kind !== "gate") return true;
  const records = Object.values(progress?.records ?? {});
  const sum = (k) => records.reduce((a, r) => a + (r[k] ?? 0), 0);
  switch (node.gateType) {
    case "clearAny":
      return sum("normalEnds") + sum("happyEnds") >= 1;
    case "happyAny":
      return sum("happyEnds") >= 1;
    case "playedAny":
      return sum("tries") >= 1;
    case "crowns":
      return (progress?.totalCrowns ?? 0) >= (node.gateValue ?? 0);
    case "clearDelta":
      return records.some((r) => r.bestDelta != null && r.bestDelta <= (node.gateValue ?? 0));
    default:
      throw new Error(`starNodes ${node.id}: 不明な gateType "${node.gateType}"`);
  }
}

// 原点から到達できるノード id の集合。通れるのは origin / 有効な node / 開いた gate
function reachable(characterId, activeSet, progress) {
  const nodes = nodesOf(characterId);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const passable = (n) => n.kind === "origin" || (n.kind === "gate" ? gateOpen(n, progress) : activeSet.has(n.id));
  const seen = new Set([originOf(characterId).id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of nodes) {
      if (seen.has(n.id) || !passable(n)) continue;
      if ((n.fromIds || []).some((f) => seen.has(f) && byId.has(f))) {
        seen.add(n.id);
        grew = true;
      }
    }
  }
  return seen;
}

// 有効ノードの正規化: 存在する node で、原点から到達できるものだけを id 昇順で返す
export function normalize(characterId, activeNodeIds, progress = null) {
  const nodes = nodesOf(characterId);
  const nodeIds = new Set(nodes.filter((n) => n.kind === "node").map((n) => n.id));
  const active = new Set((activeNodeIds || []).filter((id) => nodeIds.has(id)));
  const seen = reachable(characterId, active, progress);
  return [...active].filter((id) => seen.has(id)).sort((a, b) => a - b);
}

// ノードを ON/OFF。ON は「いちばん近い到達済みの地点からの道」を一緒に有効化する (道が無ければ変えない)
export function toggleNode(characterId, activeNodeIds, nodeId, progress = null) {
  const current = normalize(characterId, activeNodeIds, progress);
  const nodes = nodesOf(characterId);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = byId.get(nodeId);
  if (!target || target.kind !== "node") return current;
  if (current.includes(nodeId))
    return normalize(
      characterId,
      current.filter((id) => id !== nodeId),
      progress,
    );

  const seen = reachable(characterId, new Set(current), progress);
  // 逆向き BFS: target から fromIds をたどって到達済みの地点に着く最短の道 (閉じた gate は通れない)
  const prev = new Map([[nodeId, null]]);
  const queue = [nodeId];
  let found = null;
  while (queue.length && found == null) {
    const id = queue.shift();
    for (const f of byId.get(id)?.fromIds || []) {
      if (prev.has(f)) continue;
      const n = byId.get(f);
      if (!n) continue;
      if (n.kind === "gate" && !gateOpen(n, progress)) continue;
      prev.set(f, id);
      if (seen.has(f)) {
        found = f;
        break;
      }
      queue.push(f);
    }
  }
  if (found == null) return current;
  const next = new Set(current);
  for (let id = prev.get(found); id != null; id = prev.get(id)) if (byId.get(id).kind === "node") next.add(id);
  return normalize(characterId, [...next], progress);
}

// 変動値の合計
export function deltaOf(characterId, activeNodeIds) {
  const nodes = nodesOf(characterId);
  return nodes.filter((n) => n.kind === "node" && activeNodeIds.includes(n.id)).reduce((a, n) => a + (n.delta ?? 0), 0);
}

// ラン開始時のスナップショット (02 state.star)。有効ノードの効果をそのまま並べる (フラットな合計は持たない)
export function snapshot(characterId, activeNodeIds, progress = null) {
  const ids = normalize(characterId, activeNodeIds, progress);
  const nodes = nodesOf(characterId);
  const effects = nodes
    .filter((n) => n.kind === "node" && ids.includes(n.id) && n.effectType)
    .sort((a, b) => a.id - b.id)
    .map((n) => ({ nodeId: n.id, type: n.effectType, values: [...(n.values || [])] }));
  return { activeNodeIds: ids, delta: deltaOf(characterId, ids), effects };
}

// 難易度プリセットのノード集合 (normal は全部オフ)
export function presetNodeIds(characterId, difficulty) {
  if (difficulty === "normal") return [];
  const preset = master.all("starPresets").find((p) => p.characterId === characterId && p.difficulty === difficulty);
  if (!preset) throw new Error(`starPresets に characterId=${characterId} difficulty=${difficulty} が無い`);
  return [...preset.nodeIds];
}

// プリセット適用: 現在の有効ノードを捨ててプリセットを有効化 (到達できないノードは落ちる)
export function applyPreset(characterId, difficulty, progress = null) {
  return normalize(characterId, presetNodeIds(characterId, difficulty), progress);
}
