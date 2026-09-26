// 良性ステート 好調 (11): 次の 1 回の通常攻撃の攻撃力 +values[0] × スタック。一撃の直後 (drain より前) に全部消費する
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "status",
  key: "focus",
  values: [{ name: "amount", type: "int", min: 1 }],
  text: { shape: "attack", chip: "focus", polarity: "good" },
  modifiers: {
    attackPower: {
      stage: "flat",
      order: 300,
      apply: (ctx, src) => (src.side === "player" ? { label: "status.focus", value: (src.def.values?.[0] ?? 0) * src.value } : null),
    },
  },
  hooks: {
    "player.strike.after": {
      order: 50,
      when: (ctx, src) => src.side === "player",
      run: (ctx, src) => {
        ctx.removeStatus("player", src.statusKey, { cause: "strike" });
      },
    },
  },
});
