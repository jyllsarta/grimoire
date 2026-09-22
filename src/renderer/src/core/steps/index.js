// ============================================================
// ステップの一覧 (03 の 2 つの表と同じ並び)。ここは登録だけ。中身は各ファイル。
// ============================================================
import runStart from "./run/run_start.js";
import chapterBuild from "./chapter/chapter_build.js";
import chapterStart from "./chapter/chapter_start.js";
import panelTaken from "./chapter/panel_taken.js";
import panelDumped from "./chapter/panel_dumped.js";
import entityGained from "./chapter/entity_gained.js";
import entitySpent from "./chapter/entity_spent.js";
import eventResolved from "./chapter/event_resolved.js";
import chapterClear from "./chapter/chapter_clear.js";
import intermissionEnter from "./chapter/intermission_enter.js";
import intermissionLeave from "./chapter/intermission_leave.js";
import actionItem from "./action/action_item.js";
import actionAbility from "./action/action_ability.js";
import actionEquipToggle from "./action/action_equip_toggle.js";
import playerDamaged from "./damage/player_damaged.js";
import enemyDamaged from "./damage/enemy_damaged.js";
import runEnd from "./run/run_end.js";

import battleStart from "./battle/battle_start.js";
import turnStart from "./battle/turn_start.js";
import select from "./battle/select.js";
import turnCommand from "./battle/turn_command.js";
import playerTick from "./battle/player_tick.js";
import turnOrder from "./battle/turn_order.js";
import playerStrikeBefore from "./battle/player_strike_before.js";
import playerStrike from "./battle/player_strike.js";
import playerStrikeAfter from "./battle/player_strike_after.js";
import playerActSkipped from "./battle/player_act_skipped.js";
import playerActEnd from "./battle/player_act_end.js";
import enemyActBegin from "./battle/enemy_act_begin.js";
import enemyStunned from "./battle/enemy_stunned.js";
import enemyAction from "./battle/enemy_action.js";
import enemyActAfter from "./battle/enemy_act_after.js";
import turnEnd from "./battle/turn_end.js";
import fleeCommand from "./battle/flee_command.js";
import fleeDone from "./battle/flee_done.js";
import battleVictory from "./battle/battle_victory.js";
import battleDefeat from "./battle/battle_defeat.js";
import battleEnd from "./battle/battle_end.js";

export const STEPS = [
  // ラン・章スコープ
  runStart,
  chapterBuild,
  chapterStart,
  panelTaken,
  panelDumped,
  entityGained,
  entitySpent,
  eventResolved,
  chapterClear,
  intermissionEnter,
  intermissionLeave,
  actionItem,
  actionAbility,
  actionEquipToggle,
  playerDamaged,
  enemyDamaged,
  runEnd,
  // バトル (battle.step の値)
  battleStart,
  turnStart,
  select,
  turnCommand,
  playerTick,
  turnOrder,
  playerStrikeBefore,
  playerStrike,
  playerStrikeAfter,
  playerActSkipped,
  playerActEnd,
  enemyActBegin,
  enemyStunned,
  enemyAction,
  enemyActAfter,
  turnEnd,
  fleeCommand,
  fleeDone,
  battleVictory,
  battleDefeat,
  battleEnd,
];

export const STEP_BY_NAME = Object.fromEntries(STEPS.map((s) => [s.name, s]));
if (Object.keys(STEP_BY_NAME).length !== STEPS.length) throw new Error("steps: name が重複している");

export const RUN_STEP_NAMES = STEPS.filter((s) => s.scope === "run").map((s) => s.name);
export const BATTLE_STEPS = Object.fromEntries(STEPS.filter((s) => s.scope === "battle").map((s) => [s.name, s]));
export const BATTLE_STEP_NAMES = Object.keys(BATTLE_STEPS);
export const ALL_STEP_NAMES = STEPS.map((s) => s.name);

export function stepOf(name) {
  const step = STEP_BY_NAME[name];
  if (!step) throw new Error(`unknown step: ${name}`);
  return step;
}

export function isBattleStep(name) {
  return name in BATTLE_STEPS;
}

// advance を受け付けるステップか (select と battle.end 以外)
export function isAdvanceable(name) {
  const def = BATTLE_STEPS[name];
  return !!def && !def.input && !def.terminal;
}

// 標準処理の一覧 (gen_schema / インスペクタ用)
export function standardOf(name) {
  return STEP_BY_NAME[name]?.standard ?? [];
}
