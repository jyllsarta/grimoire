// ============================================================
// ラン (newRun / serialize / deserialize / migrate)。06_save の run.json はこの state そのもの
// ============================================================

import { createState, SCHEMA_VERSION } from "./state/schema.js";
import { createCtx } from "./ctx.js";
import { master } from "./master/index.js";

export { SCHEMA_VERSION };

// state を作り、run.start → chapter.build → chapter.start を発火して最初の章に立った状態を返す
export function newRun({ characterId, bookId, seed = 1, star = null, difficulty = null, appVersion = "dev", edition = "prod", now = null }) {
  master.get("characters", characterId);
  const book = master.get("books", bookId);
  if (book.chapterIds.length === 0) throw new Error(`books ${bookId} に chapterIds が無い`);
  const state = createState({ characterId, bookId, seed, star, difficulty, appVersion, edition, now });
  const ctx = createCtx(state);
  ctx.fire("run.start");
  ctx.fire("chapter.build");
  ctx.fire("chapter.start");
  return state;
}

export function serialize(state) {
  return JSON.stringify(state);
}

// schemaVersion が古ければ migrations を順に当てる。当てられなければ null (ランを破棄して通知する)
export const migrations = {
  // 2: (state) => { ...; return state; },
};

export function migrate(state) {
  let v = state.schemaVersion ?? 0;
  while (v < SCHEMA_VERSION) {
    const step = migrations[v + 1];
    if (!step) return null;
    state = step(state);
    v += 1;
    state.schemaVersion = v;
  }
  return state;
}

export function deserialize(json) {
  if (!json) return null;
  let state;
  try {
    state = typeof json === "string" ? JSON.parse(json) : json;
  } catch (e) {
    return null;
  }
  if (!state || typeof state !== "object" || state.schemaVersion == null) return null;
  return migrate(state);
}
