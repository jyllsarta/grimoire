// デスサイズちゃん固有バステ 1 (仮): とろとろ — attackPower -2。中身は M2 でヒロインの設定に合わせて作り直す
import { defineEffect } from "../../../define.js";

export default defineEffect({
  family: "status",
  key: "ds_unique1",
  values: [],
  text: { chip: "ds_unique1", sd: "unique_ds_unique1" },
  modifiers: {
    attackPower: { stage: "flat", order: 450, apply: (ctx, src) => (src.unique ? { label: "unique.ds_unique1", value: -2 } : null) },
  },
});
