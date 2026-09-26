// outbox の一発物 → Fragment への変換表 (01「fragments/」)。core は演出を知らない。
// 戦闘中の数字・トーストは BattleLayer がレイアウトを知っているので自分で描く。ここは画面全体に出すものだけ
import { addFragment } from "./fragment_store.js";
import { T } from "../text.js";
import { master } from "@core/master/index.js";

function nameOf(kind, defId) {
  const table = { equipment: "equipments", item: "items", ability: "abilities", relic: "relics" }[kind];
  return table ? master.get(table, defId).name : "";
}

export function fragmentsFor(event, state) {
  const p = event.payload;
  switch (event.type) {
    case "eventChoose": {
      const ev = master.get("events", p.defId);
      if (ev.kind === "misfortune" && ev.cutin) addFragment("Cutin", { cutin: ev.cutin });
      break;
    }
    case "defeat":
      addFragment("MessageBar", { message: T("result.lose"), tone: "bad", duration: 900 });
      break;
    case "gain":
      if (!state.battle) addFragment("Toast", { message: T("fx.gain", { name: nameOf(p.kind, p.defId) }), tone: "good" });
      break;
    case "pendingGain":
      addFragment("Toast", { message: T("fx.pendingGain", { name: nameOf(p.kind, p.defId) }), tone: "bad" });
      break;
    case "relicGain":
      addFragment("Toast", { message: T("fx.relicGain", { name: nameOf("relic", p.defId) }), tone: "good" });
      break;
    case "coinGain":
      if (!state.battle && p.amount !== 0)
        addFragment("Toast", { message: T("fx.coinGain", { n: `${p.amount > 0 ? "+" : ""}${p.amount}` }), tone: p.amount > 0 ? "good" : "bad" });
      break;
    case "loseEntities":
      addFragment("Toast", { message: T("fx.loseEntities"), tone: "bad" });
      break;
    case "harshnessGain":
      addFragment("Toast", { message: T("fx.harshnessGain"), tone: "bad" });
      break;
    case "rewards":
      addFragment("MessageBar", { message: T("fx.rewards", { jewel: p.jewel, crown: p.crown }), tone: "good", duration: 800 });
      break;
    case "extraUnlocked":
      addFragment("MessageBar", { message: T("fx.extraUnlocked"), tone: "bad", duration: 1000 });
      break;
    case "bossAppear":
      addFragment("MessageBar", { message: T("fx.bossAppear"), tone: "bad", duration: 700 });
      break;
    case "chapterClearAppear":
      addFragment("MessageBar", { message: T("fx.chapterClearAppear"), tone: "good", duration: 700 });
      break;
    case "statusApply":
      if (!state.battle && p.target === "player")
        addFragment("Toast", { message: `${master.byKey("statuses", p.key).name} ${p.value}`, tone: p.polarity === "bad" ? "bad" : "good" });
      break;
    case "uniqueApply":
      if (!state.battle) addFragment("Toast", { message: `${master.byKey("statuses", p.key).name} ${p.turns}`, tone: "bad" });
      break;
    case "crossBreak":
      if (!state.battle && p.changed) addFragment("MessageBar", { message: T("fx.crossBreak.half"), tone: "bad", duration: 600 });
      break;
    default:
      break;
  }
}
