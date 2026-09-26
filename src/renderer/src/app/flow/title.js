// ============================================================
// タイトルからの導線 (07 シーン遷移): はじめる → (初回) オープニング → 難易度 → メニュー
// ============================================================
import { master } from "@core/master/index.js";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { playSkitFor } from "./skits.js";

// オラクルちゃん = 本を持たない character (key oracle)。オープニングの持ち主
export function oracleId() {
  return master.byKey("characters", "oracle").id;
}

export async function startFromTitle() {
  const session = useSessionStore();
  if (!session.progress.flags.sawOpening) {
    await playSkitFor("opening", oracleId());
    await session.setFlag("sawOpening", true);
  }
  if (!session.progress.flags.difficultyChosen) await session.openDialog("difficulty");
  session.setScene("menu");
}

export async function resumeRun() {
  const session = useSessionStore();
  const run = useRunStore();
  const state = await run.resume();
  if (state) session.setScene("inGame");
  return state;
}
