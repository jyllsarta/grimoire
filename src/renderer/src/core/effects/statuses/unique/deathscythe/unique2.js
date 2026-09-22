// デスサイズちゃん固有バステ 2 (仮): ふわふわ — enemyAttack +1。中身は M2 で作り直す
import { defineEffect } from "../../../define.js";

export default defineEffect({
  family: "status",
  key: "ds_unique2",
  values: [],
  text: { chip: "ds_unique2", sd: "unique_ds_unique2" },
  modifiers: {
    enemyAttack: { stage: "flat", order: 450, apply: (ctx, src) => (src.unique ? { label: "unique.ds_unique2", value: 1 } : null) },
  },
});
