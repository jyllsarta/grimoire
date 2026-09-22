// ============================================================
// 効果モジュールのレジストリ (03「レジストリの並び」)。family ごとに **明示的に** 列挙する。
// 並びは同 order の同点解決に使うので、並びを変えるのは設計変更。
//   statuses → costumes → bookRules → passives → relics → star → items → abilities → enemyActions → eventEffects
// 検証 (master/validate.js) は「マスタの type 列 ∈ レジストリの key」と values schema をここから機械的に確認し、
// tools/gen_schema.js が data/SCHEMA.md を生成する。
// M1 は骨格 + 代表的なもの。残りは M2 で 1 モジュール 1 ファイルで足す。
// ============================================================

import poison from "./statuses/poison.js";
import sleep from "./statuses/sleep.js";
import paralyze from "./statuses/paralyze.js";
import arousal from "./statuses/arousal.js";
import sticky from "./statuses/sticky.js";
import confusion from "./statuses/confusion.js";
import power from "./statuses/power.js";
import abilityDamage from "./statuses/abilityDamage.js";
import powerDelta from "./statuses/powerDelta.js";
import blockDelta from "./statuses/blockDelta.js";
import dsUnique1 from "./statuses/unique/deathscythe/unique1.js";
import dsUnique2 from "./statuses/unique/deathscythe/unique2.js";

import costumeNormal from "./costumes/normal.js";
import costumeHalf from "./costumes/half.js";
import costumeFull from "./costumes/full.js";
import costumeSpecial1 from "./costumes/special1.js";

import armorForbidden from "./bookRules/armorForbidden.js";
import weaponCostPlus from "./bookRules/weaponCostPlus.js";

import passivePierce from "./passives/pierce.js";
import passiveDrain from "./passives/drain.js";
import passivePoison from "./passives/poison.js";

import healEachTurn from "./relics/healEachTurn.js";
import maxHpPlus from "./relics/maxHpPlus.js";
import slotPlus from "./relics/slotPlus.js";
import basePowerPlus from "./relics/basePowerPlus.js";
import battleStartShield from "./relics/battleStartShield.js";
import weaponAttack from "./relics/weaponAttack.js";

import starMaxHpPlus from "./star/maxHpPlus.js";
import starMaxHpMinus from "./star/maxHpMinus.js";
import starPowerPlus from "./star/powerPlus.js";
import starPowerMinus from "./star/powerMinus.js";
import starSlotPlus from "./star/slotPlus.js";
import starSlotMinus from "./star/slotMinus.js";
import starEnemyHpPlus from "./star/enemyHpPlus.js";
import starEnemyHpMinus from "./star/enemyHpMinus.js";
import starStartHpMinus from "./star/startHpMinus.js";
import starBadDurationPlus from "./star/badDurationPlus.js";
import starStartRelic from "./star/startRelic.js";
import starStartEquipment from "./star/startEquipment.js";
import starStartItem from "./star/startItem.js";
import starStartAbility from "./star/startAbility.js";

import itemInstantHeal from "./items/instantHeal.js";
import itemAttack from "./items/attack.js";
import itemShield from "./items/shield.js";
import itemWearCostume from "./items/wearCostume.js";

import abilityAttack from "./abilities/attack.js";
import abilityBlock from "./abilities/block.js";

import enemyAttack from "./enemyActions/attack.js";
import enemyBlock from "./enemyActions/block.js";
import enemyRest from "./enemyActions/rest.js";
import enemySelfHarm from "./enemyActions/selfHarm.js";
import enemyPierce from "./enemyActions/pierce.js";
import enemyBlitz from "./enemyActions/blitz.js";
import enemyCrossBreak from "./enemyActions/crossBreak.js";

import eventCoins from "./eventEffects/coins.js";
import eventHp from "./eventEffects/hp.js";
import eventGainEquipment from "./eventEffects/gainEquipment.js";
import eventGainItem from "./eventEffects/gainItem.js";
import eventGainAbility from "./eventEffects/gainAbility.js";
import eventStatus from "./eventEffects/status.js";
import eventCrossBreak from "./eventEffects/crossBreak.js";

export const REGISTRY = {
  // ステートは並びが意味を持つ (フックの同点解決の順)
  status: [poison, sleep, paralyze, arousal, sticky, confusion, power, abilityDamage, powerDelta, blockDelta, dsUnique1, dsUnique2],
  costume: [costumeNormal, costumeHalf, costumeFull, costumeSpecial1],
  bookRule: [armorForbidden, weaponCostPlus],
  passive: [passivePierce, passiveDrain, passivePoison],
  relic: [healEachTurn, maxHpPlus, slotPlus, basePowerPlus, battleStartShield, weaponAttack],
  star: [
    starMaxHpPlus,
    starMaxHpMinus,
    starPowerPlus,
    starPowerMinus,
    starSlotPlus,
    starSlotMinus,
    starEnemyHpPlus,
    starEnemyHpMinus,
    starStartHpMinus,
    starBadDurationPlus,
    starStartRelic,
    starStartEquipment,
    starStartItem,
    starStartAbility,
  ],
  item: [itemInstantHeal, itemAttack, itemShield, itemWearCostume],
  ability: [abilityAttack, abilityBlock],
  enemyAction: [enemyAttack, enemyBlock, enemyRest, enemySelfHarm, enemyPierce, enemyBlitz, enemyCrossBreak],
  eventEffect: [eventCoins, eventHp, eventGainEquipment, eventGainItem, eventGainAbility, eventStatus, eventCrossBreak],
};

const FAMILY_ORDER = ["status", "costume", "bookRule", "passive", "relic", "star", "item", "ability", "enemyAction", "eventEffect"];

const all = FAMILY_ORDER.flatMap((family) => {
  const mods = REGISTRY[family];
  for (const m of mods) if (m.family !== family) throw new Error(`registry: ${family} に family=${m.family} のモジュール ${m.key} が入っている`);
  return mods;
});
const index = new Map(all.map((m, i) => [m, i]));
const byFamilyKey = new Map(all.map((m) => [`${m.family}.${m.key}`, m]));
if (byFamilyKey.size !== all.length) {
  const seen = new Set();
  for (const m of all) {
    const k = `${m.family}.${m.key}`;
    if (seen.has(k)) throw new Error(`registry: ${k} が重複している`);
    seen.add(k);
  }
}

export const registry = {
  all,
  families: FAMILY_ORDER,
  byFamily(family) {
    return REGISTRY[family] || [];
  },
  find(family, key) {
    return byFamilyKey.get(`${family}.${key}`) ?? null;
  },
  has(family, key) {
    return byFamilyKey.has(`${family}.${key}`);
  },
  keys(family) {
    return (REGISTRY[family] || []).map((m) => m.key);
  },
  indexOf(mod) {
    return index.get(mod) ?? -1;
  },
};

export default registry;
