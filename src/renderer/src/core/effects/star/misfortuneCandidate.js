// スター: 不利イベント values[0] を幕間のショップ候補 (その他枠) に混ぜる (呪われ体質。R3 Q17)。買うと ownedPanels (kind=event) で毎章の山札に入る。価格は events.price
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "star",
  key: "misfortuneCandidate",
  values: [{ name: "eventId", type: "int" }],
  refs: [{ index: 0, table: "events" }],
  text: { shape: "event", sign: -1 },
  lists: {
    shopCandidates: { order: 200, provide: (ctx, src) => [{ kind: "event", defId: src.values[0] }] },
  },
});
