// outbox の一発物 → Fragment への変換表 (01「fragments/」)。core は演出を知らない
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
    case "playerStrike":
      addFragment("NumberPop", { side: "enemy", value: p.dmg, kind: p.blocked > 0 && p.dmg === 0 ? "blocked" : "damage" });
      break;
    case "enemyAttack":
      addFragment("NumberPop", { side: "player", value: p.passed, kind: p.passed === 0 ? "blocked" : "damage" });
      break;
    case "playerPoisonTick":
    case "enemyPoisonTick":
      addFragment("NumberPop", { side: event.type === "playerPoisonTick" ? "player" : "enemy", value: p.value, kind: "poison" });
      break;
    case "heal":
      if (p.healed > 0) addFragment("NumberPop", { side: "player", value: p.healed, kind: "heal" });
      break;
    case "parry":
      addFragment("MessageBar", { message: "パリィ!!", tone: "good", duration: 500 });
      break;
    case "blitz":
      addFragment("MessageBar", { message: "せんせいこうげき!", tone: "bad", duration: 400 });
      break;
    case "statusApply":
      addFragment("Toast", { message: `${master.byKey("statuses", p.key).name} ${p.value}`, tone: p.polarity === "bad" ? "bad" : "good" });
      break;
    case "uniqueApply":
      addFragment("Toast", { message: `${master.byKey("statuses", p.key).name} ${p.turns}`, tone: "bad" });
      break;
    case "crossBreak":
      if (p.changed) addFragment("MessageBar", { message: "クロスブレイク!", tone: "bad", duration: 600 });
      break;
    case "victory":
      addFragment("MessageBar", { message: `たおした! +${p.coin} コイン`, tone: "good", duration: 700 });
      break;
    case "defeat":
      addFragment("MessageBar", { message: T("result.lose"), tone: "bad", duration: 900 });
      break;
    case "fleeDone":
      addFragment("MessageBar", { message: "にげた!", tone: "normal", duration: 500 });
      break;
    case "gain":
      addFragment("Toast", { message: `${nameOf(p.kind, p.defId)} を手にいれた`, tone: "good" });
      break;
    case "equipBreak":
    case "itemBreak":
    case "abilityBreak":
      addFragment("Toast", { message: `${nameOf(p.kind, p.defId)} をつかいきった`, tone: "normal" });
      break;
    case "abilityReady":
      addFragment("Toast", { message: `${nameOf("ability", p.defId)} がふっかつ!`, tone: "good" });
      break;
    case "relicProc":
      addFragment("Toast", { message: `${nameOf("relic", p.defId)} はつどう!`, tone: "good" });
      break;
    case "rewards":
      addFragment("MessageBar", { message: `クリア! ジュエル +${p.jewel} クラウン +${p.crown}`, tone: "good", duration: 800 });
      break;
    case "sleepSkip":
      addFragment("MessageBar", { message: "zzz…", tone: "bad", duration: 500 });
      break;
    default:
      break;
  }
}
