// newRun → console 捕捉 → outbox 購読 → 自動プレイ → 結果 + 診断 (08)
import { newRun } from "../../src/renderer/src/core/run.js";
import { subscribe } from "../../src/renderer/src/core/outbox.js";
import { autoPlay } from "./auto_play.js";
import { makeInvariantCollector } from "./invariants.js";
import { explain } from "./explain.js";

// console.warn / console.error を捕捉する。ロジックから warn / error が出てはいけない
function withConsoleCapture(fn) {
  const warns = [];
  const errors = [];
  const origWarn = console.warn;
  const origError = console.error;
  console.warn = (...a) => warns.push(a.map(String).join(" "));
  console.error = (...a) => errors.push(a.map(String).join(" "));
  let threw = null;
  let result = null;
  try {
    result = fn();
  } catch (e) {
    threw = e;
  } finally {
    console.warn = origWarn;
    console.error = origError;
  }
  return { warns, errors, threw, result };
}

export function runGame({
  characterId = 1,
  bookId = 1,
  seed = 1,
  star = null,
  playProb = 0.85,
  checkInvariants = false,
  maxSteps = 5000,
  keepEvents = 200,
} = {}) {
  const events = [];
  const commands = [];
  const unsubscribe = subscribe((e) => {
    events.push(e);
    if (events.length > keepEvents) events.shift();
  });
  const inv = checkInvariants ? makeInvariantCollector() : null;
  let state = null;
  const cap = withConsoleCapture(() => {
    state = newRun({ characterId, bookId, seed, star });
    inv?.afterCommand(state, "newRun");
    return autoPlay(state, {
      seed,
      playProb,
      maxSteps,
      onCommand: (name, args, result) => {
        commands.push({ name, args, result });
        if (commands.length > 50) commands.shift();
        if (result?.ok) inv?.afterCommand(state, name);
      },
    });
  });
  unsubscribe();
  const invariants = inv ? inv.violations : [];
  const wedged = cap.result?.wedged === true;
  const ok = cap.warns.length === 0 && cap.errors.length === 0 && !cap.threw && invariants.length === 0 && !wedged && cap.result?.ended === true;
  const text = ok
    ? ""
    : explain({ state, events, commands, error: cap.threw, invariants }) +
      (wedged ? `\nwedged: ${cap.result.reason}` : "") +
      (cap.warns.length ? `\nwarns: ${cap.warns.join(" | ")}` : "");
  return { ok, wedged, ...cap, invariants, events, commands, state, seed, explain: text };
}

export default runGame;
