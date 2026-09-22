// 混乱 (04): onApply で pos を rng でシャッフル + concealed + 次の turn.start で 1 回だけ全装備 OFF。消滅で concealed = false
import { defineEffect } from "../define.js";
import { entitySize } from "../../domain/entity.js";

export default defineEffect({
  family: "status",
  key: "confusion",
  values: [],
  text: { shape: "confusion", chip: "confusion" },
  onApply: (ctx, src, { target }) => {
    if (target !== "player") return;
    const inv = ctx.state.inventory;
    // 実体の並び順をシャッフルして左から詰め直す (幅の合計は変わらないので必ず入る)
    const order = ctx.shuffle([...inv.entities]);
    let pos = 0;
    for (const e of order) {
      e.pos = pos;
      pos += entitySize(e);
    }
    inv.concealed = true;
    ctx.memo(src, "pendingDeactivate", true);
    ctx.emit("confusionShuffle", {});
  },
  onExpire: (ctx, src) => {
    if (src.side !== "player") return;
    ctx.state.inventory.concealed = false;
    ctx.memo(src, "pendingDeactivate", false);
  },
  hooks: {
    "turn.start": {
      order: 100,
      when: (ctx, src) => src.side === "player" && ctx.memo(src, "pendingDeactivate") === true,
      run: (ctx, src) => {
        for (const e of ctx.state.inventory.entities) if (e.kind === "equipment") e.active = false;
        ctx.memo(src, "pendingDeactivate", false);
        ctx.emit("confusionDeactivate", {});
      },
    },
  },
});
