// star family の発生源: ラン開始時にスナップショットした有効ノードの効果 (state.star.effects)
export function enumerate(state, out) {
  for (const eff of state.star.effects) {
    out.push({ family: "star", key: eff.type, def: eff, values: eff.values, nodeId: eff.nodeId });
  }
}
