// shopCandidates: 幕間の抽選候補 [{kind, defId}]。base = 挑戦キャラの装備 / アイテム / アビリティ + 共通・専用の未所持レリック (locked は除く)。
// 寄与: star.unlock* (locked の解放), star.misfortuneCandidate (不利イベントを候補に)
import { defineList } from "./_define.js";
import { master } from "../master/index.js";

export default defineList({
  name: "shopCandidates",
  base: (ctx) => {
    const cid = ctx.state.characterId;
    const owned = new Set(ctx.state.relics.map((r) => r.defId));
    const out = [];
    for (const e of master.all("equipments")) if (e.characterId === cid && !e.locked) out.push({ kind: "equipment", defId: e.id });
    for (const e of master.all("items")) if (e.characterId === cid && !e.locked) out.push({ kind: "item", defId: e.id });
    for (const e of master.all("abilities")) if (e.characterId === cid && !e.locked) out.push({ kind: "ability", defId: e.id });
    for (const r of master.all("relics")) {
      if ((r.characterId === -1 || r.characterId === cid) && !r.locked && !owned.has(r.id)) out.push({ kind: "relic", defId: r.id });
    }
    return out;
  },
});
