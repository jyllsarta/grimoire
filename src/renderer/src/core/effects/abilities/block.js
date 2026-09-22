// アビリティ: このターンだけブロック +values[0] (バトルバフ blockDelta、turns 1)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "ability",
  key: "block",
  values: [{ name: "block", type: "int", min: 1 }],
  text: { shape: "block" },
  use: (ctx, src) => {
    ctx.addBuff("player", "blockDelta", src.values[0], 1);
    return true;
  },
});
