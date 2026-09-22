// 入替ダミー (05): placeholder 行を挑戦中 character の同 slot に解決する。該当が無ければマスタ不整合として例外 (フォールバックしない)
import { master } from "../master/index.js";

export function resolveEnemyPlaceholder(state, enemyId) {
  const def = master.get("enemies", enemyId);
  if (def.kind !== "placeholder") return enemyId;
  const hit = master.all("enemies").find((e) => e.kind === "characterUnique" && e.characterId === state.characterId && e.slot === def.slot);
  if (!hit)
    throw new Error(`enemies に characterId=${state.characterId} slot=${def.slot} の characterUnique が無い (placeholder ${enemyId} を解決できない)`);
  return hit.id;
}

export function resolveEventPlaceholder(state, eventId) {
  const def = master.get("events", eventId);
  if (def.kind !== "placeholder") return eventId;
  const hit = master.all("events").find((e) => e.kind !== "placeholder" && e.characterId === state.characterId && e.slot === def.slot);
  if (!hit) {
    throw new Error(
      `events に characterId=${state.characterId} slot=${def.slot} のヒロイン固有イベントが無い (placeholder ${eventId} を解決できない)`,
    );
  }
  return hit.id;
}
