// デスサイズちゃん固有バステ 1 結晶化 (11): バトル中に逃げられない (許可 canFlee 不許可)。
// app は text.fleeOverlay を見て「にげる」ボタンに結晶化のテクスチャを置く (素材は人間側)
import { defineEffect } from "../../../define.js";

export default defineEffect({
  family: "status",
  key: "ds_crystal",
  values: [],
  text: { chip: "ds_crystal", sd: "unique_ds_crystal", fleeOverlay: "crystal" },
  permissions: {
    canFlee: { order: 200, check: (ctx, src) => (src.unique ? "crystal" : null) },
  },
});
