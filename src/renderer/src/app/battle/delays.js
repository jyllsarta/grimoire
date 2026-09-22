// ============================================================
// 待ち時間の表 (01「待ち時間は app が持つ」)。イベント種別 → ms。
// 1 ステップの待ち = そのステップで出た一発物の待ちの合計 (最低 MIN_STEP_MS)。高速化トグルは倍率。
// core は秒数を知らない。表に無い種別は 0。
// ============================================================
export const DELAYS = {
  battleStart: 500,
  turnStart: 250,
  blitz: 400,
  playerStrike: 500,
  enemyBlocked: 200,
  drainHeal: 300,
  poisonApply: 300,
  weaponWear: 100,
  equipBreak: 400,
  armorWear: 100,
  itemUse: 300,
  itemBreak: 300,
  abilityUse: 400,
  abilityReady: 300,
  delayedFire: 400,
  selfBuff: 250,
  enemyDebuff: 250,
  shieldGain: 250,
  heal: 350,
  poisonCured: 250,
  statusApply: 400,
  statusSkipped: 100,
  statusExpire: 200,
  uniqueApply: 500,
  uniqueExpire: 300,
  costumeChange: 500,
  crossBreak: 600,
  crossBreakIgnored: 200,
  sleepSkip: 500,
  sleepCured: 300,
  confusionShuffle: 500,
  confusionDeactivate: 300,
  weaponsForcedOff: 300,
  enemyRoutineStart: 300,
  enemyStunned: 500,
  enemyAttack: 500,
  enemyBlock: 300,
  enemyRest: 400,
  enemySelfHarm: 400,
  enemyPoisonTick: 350,
  playerPoisonTick: 350,
  parry: 600,
  playerDamage: 200,
  enemyDamage: 100,
  relicProc: 300,
  victory: 700,
  defeat: 800,
  fleeStart: 300,
  fleeDone: 500,
  rewards: 300,
  step: 0,
};

export const MIN_STEP_MS = 120;

// そのステップで出た一発物の列から待ち時間を求める。speed は倍率 (1 = 通常、高速化は 0.4 など)
export function delayFor(events, speed = 1) {
  const sum = events.reduce((a, e) => a + (DELAYS[e.type] ?? 0), 0);
  return Math.round(Math.max(MIN_STEP_MS, sum) * speed);
}
