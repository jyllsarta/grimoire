// ============================================================
// 実体 (装備 / アイテム / アビリティ) とパネルの表示用ヘルパ (tale の entCountText / entEffects / panelStatLine / kindLabel)。
// ロジックは持たない。core の定義と state を読んで「何を描くか」だけを返す
// ============================================================
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { rechargeInfo } from "@core/queries/index.js";
import { T } from "../text.js";

export function iconPath(icon) {
  return `assets/icons/${icon}.gif`;
}
export const CROWN_ICON = "assets/etc/crown.svg";
export const COIN_ICON = "assets/etc/coin.png";

export function kindLabel(kind) {
  if (kind === "equipment") return T("kind.equipment");
  if (kind === "item") return T("kind.item");
  if (kind === "ability") return T("kind.ability");
  if (kind === "event") return T("kind.event");
  if (kind === "relic") return T("kind.relic");
  return "";
}

// 残回数 (右上の四角)。-1 は ∞。アビリティは復活までの残りを返す (準備完了なら表示なし)
export function entCountText(kind, def, ent) {
  if (kind === "ability") {
    if (ent && ent.ready === false) {
      const info = rechargeInfo(ent);
      return info.target == null ? null : String(Math.max(1, info.target - (info.progress ?? 0)));
    }
    const dur = ent ? ent.durability : def.durability == null ? -1 : def.durability;
    return dur === -1 ? null : String(dur);
  }
  const dur = ent ? ent.durability : def.durability == null ? -1 : def.durability;
  return dur === -1 ? "∞" : String(dur);
}

// 攻撃時の効果 (右下の図形列) [{shape, n}]。type ごとの表 (専用図形が無いものは icon)
const ITEM_FX = {
  instantHeal: (v) => [{ shape: "heal", n: v[0] }],
  attack: (v) => [{ shape: "attack", n: v[0] }],
  pierceAttack: (v) => [{ shape: "pierce", n: v[0] }],
  shield: (v) => [{ shape: "shield", n: v[0] }],
  wearCostume: () => [{ shape: "costume", n: null }],
};
const ABILITY_FX = {
  attack: (v) => [{ shape: "attack", n: v[0] }],
  block: (v) => [{ shape: "block", n: v[0] }],
  selfStatus: (v) => [{ shape: statusShapeOfId(v[0]), n: v[1] }],
};
function statusShapeOfId(id) {
  const def = master.find("statuses", id);
  return def ? `status:${def.key}` : "status";
}

export function entEffects(kind, def, ent, ctxPower = null) {
  if (kind === "equipment") {
    const list = [];
    if (def.power > 0) list.push({ shape: "attack", n: ctxPower ?? def.power });
    if (def.block > 0) list.push({ shape: "block", n: def.block });
    if (def.passive?.type === "pierce") list.push({ shape: "pierce", n: null });
    if (def.passive?.type === "poison") list.push({ shape: "poison", n: def.passive.values?.[0] });
    if (def.passive?.type === "drain") list.push({ shape: "heal", n: null });
    if (def.passive?.type === "lethalThresholdPlus") list.push({ shape: "lethal", n: `+${def.passive.values?.[0]}` });
    return list;
  }
  const v = def.values || [];
  const table = kind === "item" ? ITEM_FX : ABILITY_FX;
  const f = table[def.type];
  return f ? f(v) : [];
}

// 覗き見・個体説明の 1 行 (こうげき / ブロック / たいきゅう / サイズ)
export function panelStatLine(kind, def) {
  const durText = def.durability == null || def.durability === -1 ? "∞" : def.durability;
  if (kind === "equipment") {
    return [
      def.power > 0 ? T("stat.power", { n: def.power }) : "",
      def.block > 0 ? T("stat.block", { n: def.block }) : "",
      T("stat.durability", { n: durText }),
      T("stat.size", { n: def.size }),
    ]
      .filter(Boolean)
      .join(" ／ ");
  }
  if (kind === "ability") {
    const uses = def.durability != null && def.durability !== -1 ? T("stat.abilityUses", { n: def.durability }) : T("stat.ability");
    return [uses, T("stat.size", { n: def.size })].join(" ／ ");
  }
  return [T("stat.uses", { n: durText }), T("stat.size", { n: def.size })].join(" ／ ");
}

// 実体の定義とアイコン
export function entDef(ent) {
  return defOf(ent);
}
export function entIcon(ent) {
  return iconPath(defOf(ent).icon);
}

// アビリティの状態クラス: inactive = 有効にできるが OFF (装備) / disabled = 復活するまで使えない (アビリティ)
export function entStateClass(ent, q) {
  if (ent.kind === "equipment" && !ent.active) return "inactive";
  if (ent.kind === "ability" && (!ent.ready || !q.canUseAbility(ent).ok)) return "disabled";
  if (ent.kind === "item" && !q.canUseItem(ent).ok) return "disabled";
  return "";
}

export function signed(v) {
  return `${v >= 0 ? "+" : ""}${v}`;
}
