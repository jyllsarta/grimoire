// ============================================================
// いま state 上に存在する効果の発生源 (src) を列挙する。
// bus (フック) / derive (派生値) / permission が同じ列挙を使う。
//
// src = { family, key, def, instance?: {uid, memo}, target?, masked? }
//   family: status / costume / bookRule / passive / relic / star
//   (item / ability / enemyAction / eventEffect は「使用時」にだけ src を組む)
// ============================================================

import { master } from "../master/index.js";
import { registry } from "../effects/index.js";

export function activeSources(state) {
  const out = [];

  // status (player 側の共通ステートと固有バステ)。effect 列が module key (省略時は key)
  for (const s of state.player.statuses) {
    const def = master.byKey("statuses", s.key);
    out.push({ family: "status", key: def.effect || def.key, def, side: "player", value: s.value, statusKey: s.key });
  }
  if (state.player.unique) {
    const def = master.byKey("statuses", state.player.unique.key);
    out.push({
      family: "status",
      key: def.effect || def.key,
      def,
      side: "player",
      value: state.player.unique.turns,
      statusKey: def.key,
      unique: true,
    });
  }

  // costume (unique 中はマスク。表示も効果も無視される。04)
  {
    const def = master.byKey("statuses", state.player.costume);
    out.push({ family: "costume", key: def.effect || def.key, def, masked: state.player.unique != null });
  }

  // buff (player 側。statuses(kind=buff) の key)
  if (state.battle) {
    for (const b of state.battle.buffs) {
      const def = master.byKey("statuses", b.key);
      out.push({ family: "status", key: def.effect || def.key, def, side: "player", value: b.value, turns: b.turns, statusKey: b.key, buff: true });
    }
  }

  // 敵側のステート / バフ (バトル中の相手だけ)
  const enemy = battleEnemy(state);
  if (enemy) {
    for (const s of enemy.statuses) {
      const def = master.byKey("statuses", s.key);
      out.push({ family: "status", key: def.effect || def.key, def, side: "enemy", value: s.value, statusKey: s.key });
    }
    for (const b of enemy.buffs) {
      const def = master.byKey("statuses", b.key);
      out.push({ family: "status", key: def.effect || def.key, def, side: "enemy", value: b.value, turns: b.turns, statusKey: b.key, buff: true });
    }
  }

  // 敵のいまのルーチンのアクション (blitz / pierce のようなマーカーが turnOrder / enemyStrikeFlags に寄与する)
  if (enemy) {
    const panel = state.board.panels[state.battle.panelUid];
    const routines = master.whereSorted("enemyActions", "enemyId", panel.defId);
    const routine = routines.length ? routines[enemy.routineIndex % routines.length] : null;
    for (const action of routine?.actions || []) {
      out.push({ family: "enemyAction", key: action.type, def: master.get("enemies", panel.defId), action, values: [action.value ?? 0] });
    }
  }

  // bookRule
  for (const rule of master.where("bookRules", "bookId", state.bookId)) {
    out.push({ family: "bookRule", key: rule.key, def: rule });
  }

  // passive (ON の装備)
  for (const ent of state.inventory.entities) {
    if (ent.kind !== "equipment" || !ent.active) continue;
    const def = master.get("equipments", ent.defId);
    if (!def.passive || !def.passive.type) continue;
    out.push({ family: "passive", key: def.passive.type, def, instance: ent, values: def.passive.values || [] });
  }

  // relic
  for (const relic of state.relics) {
    const def = master.get("relics", relic.defId);
    out.push({ family: "relic", key: def.type, def, instance: relic, values: def.values || [] });
  }

  // star (ラン開始時のスナップショット)
  for (const eff of state.star.effects) {
    out.push({ family: "star", key: eff.type, def: eff, values: eff.values, nodeId: eff.nodeId });
  }

  return out;
}

// src に対応するモジュール (無ければ null。マスタの type がレジストリに無い = 検証で警告済み)
export function moduleOf(src) {
  return registry.find(src.family, src.key);
}

// src の values (マスタ values 列。status は statuses.values、passive/relic/star は上で詰めたもの)
export function valuesOf(src) {
  if (src.values) return src.values;
  return src.def?.values || [];
}

export function battleEnemy(state) {
  if (!state.battle) return null;
  const panel = state.board.panels[state.battle.panelUid];
  return panel?.enemy ?? null;
}

// 同点解決用の uid (インスタンスが無ければ 0)
export function uidOf(src) {
  return src.instance?.uid ?? 0;
}
