// ============================================================
// コマンド (02「フェーズ (派生) とコマンド許可」)。dispatch が phase と battle.step で許可判定してから実行する。
// 1 コマンド = { phases: [...], step?: "select" | "battle.end" | "advanceable", run(ctx, args) }
// 返り値は { ok: true, ... } か { ok: false, reason } (reason は systemTexts のキーになる語)。
// 一発物は返り値ではなく outbox に流れる。
// ============================================================

import { createCtx } from "../ctx.js";
import { phaseOf } from "../state/phase.js";
import { isAdvanceable } from "../timeline/steps.js";
import { advance } from "./advance.js";
import * as chapterCommands from "./chapter.js";
import * as battleCommands from "./battle.js";
import * as inventoryCommands from "./inventory.js";
import * as intermissionCommands from "./intermission.js";
import * as debugCommands from "./debug.js";

export const COMMANDS = {
  ...chapterCommands.commands,
  ...battleCommands.commands,
  ...inventoryCommands.commands,
  ...intermissionCommands.commands,
  ...debugCommands.commands,
  advance: { phases: ["battle"], step: "advanceable", run: (ctx) => advance(ctx) },
};

export const COMMAND_NAMES = Object.keys(COMMANDS);

// コマンドが今の state で受け付けられるか (実行はしない)
export function canDispatch(state, name) {
  const cmd = COMMANDS[name];
  if (!cmd) return { ok: false, reason: "unknownCommand" };
  const phase = phaseOf(state);
  if (!cmd.phases.includes(phase)) return { ok: false, reason: `phase.${phase}` };
  if (cmd.step) {
    const step = state.battle?.step;
    if (cmd.step === "advanceable" ? !isAdvanceable(step) : step !== cmd.step) return { ok: false, reason: `step.${step}` };
  }
  return { ok: true };
}

export function dispatch(state, name, args = {}) {
  const gate = canDispatch(state, name);
  if (!gate.ok) return gate;
  const ctx = createCtx(state);
  const result = COMMANDS[name].run(ctx, args) ?? { ok: true };
  if (result.ok) state.meta.updatedAt = new Date().toISOString();
  return result;
}
