// ============================================================
// スキットの起動 (07「スキット」)。trigger + characterId で skits を引き、あればダイアログを開いて終わりを待つ。
// 本が持つスキット (bookStart / bossBefore / bookClear / extraStart / happyEnd / normalEnd) は本の characterId、
// ヒロインが持つもの (lose) は挑戦中の characterId で引く。無ければ何もしない (マスタに無い = そのスキットは存在しない)
// ============================================================
import { master } from "@core/master/index.js";
import { useSessionStore } from "../stores/session.js";

export function skitFor(trigger, characterId) {
  return master.all("skits").find((s) => s.trigger === trigger && s.characterId === characterId) ?? null;
}

export function skitsOf(characterId) {
  return master.whereSorted("skits", "characterId", characterId);
}

export function skitLines(skitId) {
  return master.whereSorted("skitLines", "skitId", skitId);
}

// 既読でも毎回再生する (本編の流れ)。既読フラグは SkitDialog が立てる
export async function playSkitFor(trigger, characterId, params = {}) {
  const skit = skitFor(trigger, characterId);
  if (!skit) return null;
  return playSkit(skit.id, params);
}

export async function playSkit(skitId, params = {}) {
  const session = useSessionStore();
  return session.openDialog("skit", { skitId, ...params });
}

// スキットが開放済みか (07 CharacterDetail のスキット一覧): 既読なら開放。releaseByLose は敗北でも開放
export function skitUnlocked(skit, progress) {
  return !!progress?.skitsRead?.[skit.id];
}
