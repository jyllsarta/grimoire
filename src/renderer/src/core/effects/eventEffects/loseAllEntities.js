// イベント効果 loseAllEntities: インベントリの実体 (武器・防具・アイテム・アビリティ) を全部失う (逆さ吊りトラップ「リュックを落としちゃった」)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "eventEffect",
  key: "loseAllEntities",
  values: [],
  text: { shape: "lose" },
  use: (ctx, src) => {
    const inv = ctx.state.inventory;
    const lost = inv.entities;
    inv.entities = [];
    ctx.emit("loseEntities", { uids: lost.map((e) => e.uid) });
    for (const entity of lost) ctx.fire("entity.spent", { entity, kind: entity.kind, cause: "lost", source: src });
  },
});
