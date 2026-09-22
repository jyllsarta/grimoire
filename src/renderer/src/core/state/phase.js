// フェーズ (派生)。02「フェーズ (派生) とコマンド許可」
export const PHASES = ["ended", "pending", "battle", "intermission", "chapter"];

export function phaseOf(state) {
  if (state.progress.ending != null) return "ended";
  if (state.progress.pending.length > 0) return "pending";
  if (state.battle) return "battle";
  if (state.shop) return "intermission";
  return "chapter";
}
