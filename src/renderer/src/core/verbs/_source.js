// src (発生源) を一発物と damageTaken に残す形に落とす
export function describeSource(source) {
  if (!source) return null;
  return {
    family: source.family ?? null,
    key: source.key ?? source.statusKey ?? null,
    defId: source.def?.id ?? source.defId ?? null,
    uid: source.instance?.uid ?? source.uid ?? null,
  };
}
