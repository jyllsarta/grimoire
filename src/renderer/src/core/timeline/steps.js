// ============================================================
// ステップ一覧と遷移 (03「ラン・章スコープのステップ」「バトルのステップ」の表をデータにしたもの)
//
// ラン・章スコープのステップはコマンドの中で同期に発火する。
// バトルのステップは battle.step の値として state に現れ、advance が 1 回につき 1 ステップ進める。
// 標準処理の中身は standard.js、ここは「名前・settle・次のステップ」だけ。
// ============================================================

export const RUN_STEP_NAMES = [
  "run.start",
  "chapter.build",
  "chapter.start",
  "panel.taken",
  "panel.dumped",
  "entity.gained",
  "entity.spent",
  "event.resolved",
  "chapter.clear",
  "intermission.enter",
  "intermission.leave",
  "action.item",
  "action.ability",
  "action.equipToggle",
  "player.damaged",
  "enemy.damaged",
  "run.end",
];

// 遷移の呼び名 (表の「プレイヤー行動」「敵フェーズの後」)
function playerAction(battle) {
  return battle.turnMemo.skipPlayer ? "player.act.skipped" : "player.strike.before";
}

function afterEnemyPhase(battle) {
  if (battle.turnMemo.fleeing) return "flee.done";
  return battle.turnMemo.order === "enemy" ? playerAction(battle) : "turn.end";
}

// next(battle, enemy, actions) は「result を見ない素の次」。result による差し替えは settle (advance.js) が行う
export const BATTLE_STEPS = {
  "battle.start": { settle: false, next: () => "turn.start" },
  "turn.start": { settle: false, next: () => "select" },
  select: { settle: false, input: true, next: () => null },
  "turn.command": { settle: false, next: () => "player.tick" },
  "player.tick": { settle: true, next: () => "turn.order" },
  "turn.order": { settle: false, next: (b) => (b.turnMemo.order === "enemy" ? "enemy.act.begin" : playerAction(b)) },
  "player.strike.before": { settle: false, next: () => "player.strike" },
  "player.strike": { settle: false, next: () => "player.strike.after" },
  "player.strike.after": { settle: false, next: () => "player.act.end" },
  "player.act.skipped": { settle: false, next: () => "player.act.end" },
  "player.act.end": { settle: true, next: (b) => (b.turnMemo.order === "player" ? "enemy.act.begin" : "turn.end") },
  "enemy.act.begin": {
    settle: true,
    next: (b, enemy, actions) => {
      if (enemy.stunned) return "enemy.stunned";
      if (!actions || actions.length === 0) return "enemy.act.after";
      return "enemy.action";
    },
  },
  "enemy.stunned": { settle: true, next: (b) => afterEnemyPhase(b) },
  "enemy.action": {
    settle: false,
    next: (b, enemy, actions) => {
      if (b.result) return "enemy.act.after";
      return b.cursor < actions.length ? "enemy.action" : "enemy.act.after";
    },
  },
  "enemy.act.after": { settle: true, next: (b) => afterEnemyPhase(b) },
  "turn.end": { settle: false, next: () => "turn.start" },
  "flee.command": { settle: false, next: () => "enemy.act.begin" },
  "flee.done": { settle: false, next: () => "battle.end" },
  "battle.victory": { settle: false, next: () => "battle.end" },
  "battle.defeat": { settle: false, next: () => "battle.end" },
  "battle.end": { settle: false, terminal: true, next: () => null },
};

export const BATTLE_STEP_NAMES = Object.keys(BATTLE_STEPS);
export const ALL_STEP_NAMES = [...RUN_STEP_NAMES, ...BATTLE_STEP_NAMES];

export function isBattleStep(name) {
  return name in BATTLE_STEPS;
}

// advance を受け付けるステップか (select と battle.end 以外)
export function isAdvanceable(step) {
  const def = BATTLE_STEPS[step];
  return !!def && !def.input && !def.terminal;
}
