// 遷移の呼び名 (03 の表の「プレイヤー行動」「敵フェーズの後」)。複数のステップから参照される
export function playerAction(battle) {
  return battle.turnMemo.skipPlayer ? "player.act.skipped" : "player.strike.before";
}

export function afterEnemyPhase(battle) {
  if (battle.turnMemo.fleeing) return "flee.done";
  return battle.turnMemo.order === "enemy" ? playerAction(battle) : "turn.end";
}
