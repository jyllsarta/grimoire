// SD (駒) の表情対応 (xqueens の sdFaceIds をそのまま。tale の SD_FACE_MAP)。立ち絵の表情番号 → SD の 1..8
export const SD_FACE_MAP = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  7: 5,
  8: 6,
  9: 6,
  10: 4,
  11: 1,
  12: 1,
  13: 6,
  14: 6,
  15: 4,
  16: 6,
  17: 6,
  18: 6,
  19: 6,
  20: 3,
  21: 1,
  22: 1,
  23: 3,
  24: 6,
  25: 1,
  26: 6,
  27: 5,
  28: 4,
  29: 5,
  30: 7,
  31: 3,
  32: 7,
  33: 1,
  34: 2,
  35: 6,
  36: 6,
  37: 6,
  38: 6,
  91: 1,
  92: 1,
  93: 1,
};
// 白フチ (outline_<key>.png) は tools/sd_outline.py が素材より四方 1/32 ずつ広いキャンバスに描く (端まで描かれた素材でもフチが切れないように)。
// SdPiece はこの比率だけ四方にはみ出して重ねる。python 側の PAD_RATIO と揃える
export const SD_OUTLINE_PAD = 1 / 32;
export const SD_POISON_FACE = 8; // 毒のあいだ SD は常にげっそり
export const SD_CRY_FACE = 7; // >_< (クロスブレイク)

export function sdFaceOf(faceId) {
  return SD_FACE_MAP[faceId] || 1;
}

// SD の重ね順 (04): 白フチ → 羽 → 衣装レイヤー (unique なら unique_<key>、costume ≠ normal なら costume_<key>、それ以外は base のみ) → 表情 → common の重ね
export function sdLayers(characterId, player, faceId) {
  const dir = `assets/characters/${characterId}/sd`;
  const unique = player?.unique?.key ?? null;
  const costume = player?.costume ?? "normal";
  const layerKey = unique ? unique : costume;
  const layers = [`${dir}/outline_${layerKey}.png`, `${dir}/wing.png`, `${dir}/base.png`];
  if (unique) layers.push(`${dir}/unique_${unique}.png`);
  else if (costume !== "normal") layers.push(`${dir}/costume_${costume}.png`);
  const poisoned = (player?.statuses ?? []).some((s) => s.key === "poison");
  layers.push(`${dir}/face/${poisoned ? SD_POISON_FACE : sdFaceOf(faceId)}.png`);
  return layers;
}
