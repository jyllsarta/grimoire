# 03 タイムラインと効果モジュール

「xx した時 xx する」を、散在する if/else ではなく **固定のタイムライン (ステップ) + 明示的な処理順 + 1 効果 1 モジュール** で表す。
R1 Q13/Q14 の要求 (処理順を私の一存で決められる、付与順に依存しない) をここで満たす。側の名前は player / enemy (00 の命名規則)。

## 要求

1. どの効果がいつ発火するかを、コードを追わずに **ステップ表と order** だけで言える
2. 同じステップに複数の効果が乗るとき、順序は **宣言された order** で決まり、取得順・付与順・マスタの行順に依存しない
3. 「毒の適用前に攻撃力上昇」も「適用後」も、モジュール側の 1 行 (どのステップに付くか) で選べる
4. 効果を 1 つ足すときに触るのは、モジュール 1 ファイルとマスタだけ。検証と SCHEMA はレジストリから自動生成

## ステップとは

ステップは `<scope>.<moment>` の名前を持つフック点で、「標準処理 (コアが必ずやること)」と「登録された効果」を **同じ order 空間** で並べて実行する。標準処理の order を公開するので、効果はその前後どちらにも付ける。

ステップは 2 種類ある。

- **ラン・章スコープのステップ**: コマンドの中で同期に発火する (`takePanel` の中で `panel.taken` など)。コマンド 1 回で完結する
- **バトルのステップ**: `battle.step` の値として state に現れ、コマンド `advance` が **1 回につき 1 ステップ** 実行して次のステップ名を書く。演出の順番そのものがこの列で、app の StepMover が間を空けて advance を打つ (01)。xqueens の PhaseMover / `continue()` と同じ

## ラン・章スコープのステップ

| ステップ | 発火点 | 標準処理 (order) | 典型的な登録者 |
|---|---|---|---|
| `run.start` | newRun で state を作った直後、章を組む前 | 400 startRelics: `characters.startRelicIds` を所持 (固有初期レリック) → 500 initialize: hp = 派生 `startHp` → wallet.coin = 派生 `chapterCoin` → インベントリ = 派生 `startEntities` | star.startRelic (450) |
| `relic.gained` | 動詞 `gainRelic` でレリックを所持した直後 (payload: relic, def, source)。取得時の即時効果はここ (R3 Q15) | (なし) | relic.maxHpPlus (100: 現在ライフも増やす。when で自分のインスタンスに絞る) |
| `chapter.build` | 章の山札を組む | 500 buildBoard: 派生 `chapterPanelSpecs` を実体化 (ダミー敵・ダミーイベントの解決込み)、ボス生成、盤面充填 | star.initial* / star.chapterEnemy、bookRule (specs への寄与) |
| `chapter.start` | 盤面充填後 | (なし) | bookRule (章開始時の処理) |
| `panel.taken` | 盤面パネルを回収して実体がインベントリに入った後 | (なし) | relic.healOnPanelTaken、bookRule |
| `panel.dumped` | 回収せず捨てた後 (コイン +1 済み) | (なし) | |
| `entity.gained` | 実体がインベントリに入った (回収 / 獲得 / 開始品 / 保留解決) | (なし) | bookRule.foodRot (memo 初期化) |
| `entity.spent` | 使い切り・破壊で実体が消えた (kind 付き) | 500 recharge(exhaust) | passive.exhaustAddEquipment (400: 消える前に代替を得る) |
| `event.resolved` | イベントの選択肢の効果を適用した後 | 500 harshness.misfortunes を加算 (misfortune のとき) | |
| `chapter.clear` | 章クリアパネルを踏んだ直後 | 500 rewards (派生 `jewelGain` / `crownGain` を wallet へ、counters) → 600 reset (coin=0、インベントリを開始状態に、statuses / unique / costume / concealed をリセット) → 700 decideNext (Extra Chapter のクリア → ending=happy / 最終章 → 過酷さ判定: 達成なら stage=extra にして shop 生成、未達なら ending=normal / それ以外 → shop 生成) | star.jewel± / crown± (派生への寄与) |
| `intermission.enter` / `intermission.leave` | 幕間の出入り | | |
| `action.item` / `action.ability` / `action.equipToggle` | フリーアクション (バトル中の select で受け付ける) の解決後。500 で turnMemo.abilitiesUsed 等を更新 | relic.lethalScythe (100: item / ability は「行動」)、recharge.otherAbilityUse、passive.onlyWithoutAbilityThisTurn (自動 OFF。R3 Q9) |
| `player.damaged` | 動詞 `damagePlayer` が発火 (payload: tag, dmg, hpLoss, absorbed) | status.sleep (tag=enemyAttack かつ dmg ≥ 1 で解除) |
| `enemy.damaged` | 動詞 `damageEnemy` が発火 (payload: tag, dmg, blocked, absorbed) | |
| `enemy.killed` | 動詞 `damageEnemy` が敵の HP を 0 以下にした瞬間に 1 回だけ (payload: `just` = ちょうど 0、tag, source) | 500 justLethal: `just` なら recharge(justLethal) | bookRule.statusOnJustLethal (300) |
| `enemy.attack.before` | 敵アクション `attack` が 1 発撃つ直前 (payload: action, `negated`)。ハンドラが `negated = true` にするとその 1 発は無かったことになる (防具摩耗・パリィ・眠り解除に関わらない) | (なし) | status.evade (100: 1 スタック消費) |
| `run.end` | ending 確定 | | |

## バトルのステップ (`battle.step`)

`startBattle` が `battle.start` で始め、`advance` が表の「次」へ進める。`select` は入力待ちで advance しない。`battle.end` が終端で `closeBattle` を待つ。

| step | 標準処理 (order) | 次 | 典型的な登録者 |
|---|---|---|---|
| `battle.start` | 500 create: shield = 派生 `battleStartShield`、turn = 1、counters.battles += 1 | `turn.start` | relic.battleStartShield (派生への寄与)、relic.battleStartStatus (600: 回避などの付与) |
| `turn.start` | 500 fireDelayed: `battle.delayed` を全部発動して空にする (turn ≥ 2)。予約 `{source, key, values}` は積んだモジュールの `fire(ctx, entry)` で解決 (R3 Q6) | `select` | status.confusion (100: 付与後最初の turn.start で 1 回だけ全装備 OFF)、ability.delayed* (delayed に積むのは使用時) |
| `select` | (入力待ち。フリーアクション / attack / flee / cancel を受け付ける唯一のステップ) | attack → `turn.command`、flee → `flee.command` | — |
| `turn.command` | 500: started=true。眠りなら `turnMemo.skipPlayer = true` | `player.tick` | passive.powerEqualsHpAtCommand (100: memo に HP を保存) |
| `player.tick` | 500 statusTick (プレイヤー側ステートの行動前 tick。毒はここ)。**settle** | `turn.order` | status.poison |
| `turn.order` | 500: `turnMemo.order` = 派生 `turnOrder` (敵先攻ならイベント `blitz`) | order=enemy → `enemy.act.begin` / order=player → プレイヤー行動 (下) | |
| プレイヤー行動 (遷移の呼び名) | — | `turnMemo.skipPlayer` なら `player.act.skipped`、そうでなければ `player.strike.before` | |
| `player.strike.before` | (なし) | `player.strike` | |
| `player.strike` | 500 strike: 派生 `attackPower` と 派生 `strikeFlags` (pierce / blitz / drain / poisonApply) → 敵ブロック → 敵シールド → ダメージ (pierce は両方無視) → `enemy.killed` | `player.strike.after` | (登録不可。内訳は派生値で) |
| `player.strike.after` | 500 weaponWear | `player.act.end` | status.focus (50: 好調を消費)、passive.drain (300)、passive.poison (400)、relic.lethalScythe (450: 行動後の即死判定) |
| `player.act.skipped` | 500 イベント `sleepSkip` | `player.act.end` | |
| `player.act.end` | 500 statusDecay (statuses の stack/turn を -1、unique.turns を -1、0 で消滅) → 600 buffsTick (player 側 buffs の turns -1)。**settle** | order=player → `enemy.act.begin` / order=enemy → `turn.end` | |
| `enemy.act.begin` | 500 blockReset (enemy.block = 0) → 600 enemyStatusTick (敵側ステートの行動前 tick。毒はここ)。**settle** | stunned → `enemy.stunned` / アクションなし → `enemy.act.after` / それ以外 → cursor=0 で `enemy.action` | status.poison (side=both) |
| `enemy.stunned` | 500 stunned=false → 600 enemyBuffsTick → 650 enemyStatusDecay → 700 routineIndex += 1。**settle** | 敵フェーズの後 (下) | |
| `enemy.action` | 500 resolve: `actions[cursor]` を `enemyAction.<type>` モジュールが解決 (attack は 派生 `enemyAttack` と 派生 `blockValue` を使う) → cursor += 1 | result が立った → `enemy.act.after` (残りは飛ばす) / cursor < actions.length → `enemy.action` / そうでなければ `enemy.act.after` | |
| `enemy.act.after` | 200 armorWear → 300 parry (全弾ブロックなら stunned=true) → 500 enemyBuffsTick → 550 enemyStatusDecay (敵側ステートの -1) → 600 routineIndex += 1。**settle** | 敵フェーズの後 (下) | passive.rechargeAllOnBlock (100。全弾ブロックのときだけ、貫通は除く。R3 Q9)、relic.powerAfterParry (400) |
| 敵フェーズの後 (遷移の呼び名) | — | `turnMemo.fleeing` → `flee.done` / order=enemy → プレイヤー行動 / order=player → `turn.end` | |
| `turn.end` | 500 advance: turn += 1、turnMemo = {}、counters.turns += 1 → 600 recharge(turn) | `turn.start` | relic.healEachTurn (300) |
| `flee.command` | 500: started=true、`turnMemo.fleeing = true` | `enemy.act.begin` (敵に 1 回自由行動される) | |
| `flee.done` | 500 result=flee、counters.flees += 1 (イベント `fleeDone`) | `battle.end` | |
| `battle.victory` | 100 reward (coin += 派生 `killReward`) → 200 recharge(kill) → 300 recharge(turn) → 500 boardUpdate (ボスなら chapterClear パネル化、そうでなければ discard と落下・補充)、counters.kills += 1 | `battle.end` | relic.healOnKill (400) |
| `battle.defeat` | 500 ending = lose | `battle.end` | |
| `battle.end` | 500 clear delayed (終端。`closeBattle` を待つ) | — | bookRule.foodRot (戦闘数を進める) |

### 結果の確定 (settle)

- 動詞 `damagePlayer` / `damageEnemy` は hp が 0 以下になったら `battle.result` を立てるだけで、ステップは変えない
- 表で **settle** と書いたステップの末尾と、フリーアクションの末尾で、`result` が立っていれば次のステップを `battle.victory` / `battle.defeat` に差し替える (残りの経路は捨てる)
- settle 点をステップごとにしないのは、プロトの意味を保つため: 敵を倒した一撃でも drain・毒付与・武器摩耗・ステート減衰は起きる (`player.act.end` まで進んでから確定)。敵フェーズの途中で敵が自滅・毒死したら残りのアクションを飛ばして `enemy.act.after` (防具摩耗など) を通してから確定
- `flee.done` は自分で result=flee を立てて `battle.end` へ進む

### 減衰の位置 (プロトの意味を保つ)

- 共通ステート (stack / turn) と固有バステは **`player.act.end` で -1**。敵フェーズで付与された「麻痺 2」は、次の 2 回の攻撃で武器が使えない (付与ターンの終わりには減らない)。眠りも同じ場所で減るので「眠り 1」= 手番を 1 回スキップ
- 毒だけは `player.tick` でダメージ → -1
- バフ (`battle.buffs` / `enemy.buffs`) は **自分側の行動の後** に -1。`turns: 1` = 次の自分の行動 1 回に効く (パリィ後の攻撃力アップが次の一撃に乗る)。`turns: -1` は「バトル中ずっと」で減らない (R3 Q5)。「このターン」系のアイテムはこれに載せる (`[量, turns]`)
- 敵側のステート (`enemy.statuses`) は **`enemy.act.after` / `enemy.stunned` で -1**。毒は `enemy.act.begin` で tick。プレイヤー側と対称
- 逃走のターンは `turn.end` を通らないので、リチャージ (turn) もステートの減衰も進まない (プロト踏襲)

## 処理順の規則

同じステップに並ぶハンドラの順序は次で決まる。**他の要因は一切効かない**。

1. `order` の昇順。標準処理は上の表の値。効果モジュールは宣言する (省略時 100 = 「標準処理より前」)
2. 同じ order なら、レジストリ `effects/index.js` の並び順 (ファイル探索ではなく明示列挙。並びを変えるのは設計変更)
3. 同じモジュールが複数インスタンスあるとき (同じレリック 2 個、同じ装備 2 本) は uid 昇順
4. 取得順・付与順・マスタの行順・ステートの並びは順序に影響しない
5. 同一ステップに 2 つ以上の効果を載せる設計をしたら、order を必ず明示し、`test/unit/order.test.js` に期待順を固定する

「攻撃後にシールド +2」と「攻撃後に HP -3」が同時にあるなら、両方 `player.strike.after` に付け、シールドを order 350、HP 減少を order 360 と宣言する。どちらを先に取っても順序は同じ。

## 効果モジュール契約

```js
// core/effects/relics/healEachTurn.js
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "relic",                       // どのマスタの type 列を担うか (下表)
  key: "healEachTurn",                   // マスタの type 値
  values: [{ name: "amount", type: "int", min: 1 }],   // マスタ values の並びと値域。検証と SCHEMA が読む
  refs: [],                              // values の中で他テーブルを指すもの: [{ index: 0, table: "equipments" }]
  text: { shape: "heal" },               // UI 向けヒント (図形、チップ) — app 側の表がこのキーで引く
  hooks: {
    "turn.end": { order: 300, run(ctx, src) { ctx.heal(src.def.values[0], { source: src }); } },
  },
});

// core/effects/passives/powerEqualsHp.js   「HP と同じ値だけ攻撃力追加」
export default defineEffect({
  family: "passive", key: "powerEqualsHp",
  modifiers: {
    attackPower: { stage: "flat", order: 30, apply(ctx, src) { return { label: "mod.hp", value: ctx.state.player.hp }; } },
  },
});

// 「毒の適用前の HP を使う」版は、turn.command で HP を memo に取っておく
export default defineEffect({
  family: "passive", key: "powerEqualsHpAtCommand",
  hooks: { "turn.command": { order: 100, run(ctx, src) { ctx.memo(src, "hp", ctx.state.player.hp); } } },
  modifiers: {
    attackPower: { stage: "flat", order: 30, apply(ctx, src) { return { label: "mod.hpAtCommand", value: ctx.memo(src, "hp") ?? ctx.state.player.hp }; } },
  },
});
```

| 項目 | 意味 |
|---|---|
| family | `status` / `costume` / `bookRule` / `passive` (装備) / `relic` / `star` / `item` / `ability` / `enemyAction` / `eventEffect` / `choiceCondition` (イベントの選択肢の条件) |
| key | family 内で一意。マスタの type (または statuses.key) と一致 |
| values / refs | マスタ `values` の schema。足りない・型違い・参照切れは selftest が警告する |
| text | app が図形・チップ・説明の自動生成に使うヒント。ロジックは見ない (例: `fleeOverlay: "crystal"` = にげる ボタンのテクスチャ) |
| use(ctx, src) | item / ability の使用時の効果 |
| onTake(ctx, src, panel) | item / ability / passive (装備): 盤面回収の瞬間の割り込み (R3 Q7 どでかコイン)。true を返すとインベントリに入らない |
| fire(ctx, entry) | ability: `battle.delayed` に積んだ予約が `turn.start` で発火するときの処理 (R3 Q6) |
| check(ctx, src) | choiceCondition: 選択肢を出せるか (true / false)。`eventChoices.condition.type / values` |
| hooks | `{ [step]: { order, when?, run } }`。when は発火条件 (省略で常時)。run は payload を書き換えてよい (`enemy.attack.before` の `negated`) |
| modifiers | `{ [derivedName]: { stage, order, apply } }`。派生値への寄与。apply は `{label, value}` か null (寄与しない) |
| permissions | `{ [permissionName]: { order, check } }`。`check` が理由キーを返したら不許可 |
| lists | `{ [listName]: { order, provide } }`。派生リスト (山札の specs、開始品、ショップ候補) への寄与 |
| status 固有 | `side`, `duration`, `onApply`, `onExpire`, `flags` (04) |

src (source) は `{ family, key, def, instance?: {uid, memo}, target? }`。内訳の表示、order の同点解決、インスペクタ表示に使う。

登録: `core/effects/index.js` に family ごとの配列を **明示的に** 並べる。検証 (`master/validate.js`) は「マスタの type 列 ∈ レジストリの key」と values schema を機械的に確認し、`tools/gen_schema.js` が data/SCHEMA.md を生成する。

## 派生値 (内訳付き)

派生値は `derive(name, ctx, args)` で計算する。寄与は stage の順 (`base` → `flat` → `mult` → `final`)、同 stage 内は上の処理順の規則で並び、内訳 (`breakdown`) はその順で記録される。UI と インスペクタは内訳をそのまま出す。

| 派生値 | base | 既知の寄与 (v1) | 用途 |
|---|---|---|---|
| maxHp | characters.hp | relic.maxHpPlus, star.maxHp± | 上限、目盛 |
| startHp | maxHp | star.startHpMinus (final) | run.start |
| basePower | characters.power | relic.basePowerPlus, star.power± | 素手の攻撃力 |
| attackPower | basePower | 武器 (power + relic.weaponAttack), passive.powerPerAbilityThisTurn, buff.powerDelta, status.good.power / focus (好調: +2 × スタック), costume.half/full (-1、unique 中は除外), relic.powerOnTurn 等, unique statuses | 攻撃ボタンの予測と一撃 |
| strikeFlags | {} | passive.pierce / blitz / drain / poisonApply, relic.firstTurnPierce (turn 1) | 一撃の属性 (合算 1 発に全部乗る)。pierce は敵のブロックとシールドの両方を無視 |
| lethalThreshold | 0 | relic.lethalScythe (values[0]), relic.lethalThresholdPlus, passive.lethalThresholdPlus (ON の武器) | リーサルサイズが行動後に倒す敵 HP の上限 (11) |
| blockValue | 0 | 防具 block, passive.blockPerAbilityThisTurn, buff.blockDelta | 被弾とパリィ |
| enemyAttack(action) | action.value | enemy.buffs.powerDelta, enemy.statuses (恒久ダウン等), costume.full (+1), costume.special1 (turn 1 で -4), unique statuses | 敵の 1 発 |
| enemyMaxHp(defId) | enemies.hp | star.enemyHp± | 生成時 |
| turnOrder | player | enemyAction.blitz → enemy, status.sticky → enemy, passive.blitz → player (final), enemy.stunned → player | 先攻 |
| slotCount | config.startSlots | relic.slotPlus, star.slot± ; final clamp [1, maxSlots] | インベントリ |
| panelCost(panel) | def.cost | bookRule.weaponCostPlus 等 | 回収価格 |
| killReward(enemy) | enemies.reward | star.killCoin± | 撃破コイン |
| chapterCoin | characters.coins | star.chapterCoin± | 章突入時コイン |
| jewelGain / crownGain | coin + 残パネル + chapter bonus / chapter bonus | star.jewel± / crown± | 章クリア |
| healPrice / rerollPrice | **次に入る章** の chapter.healPrice (R3 Q19。Extra 前の幕間なら Extra Chapter) / config.rerollPrice | relic.healDiscount / star.rerollCost+ | 幕間 |
| battleStartShield | 0 | relic.battleStartShield | battle.start |
| harshnessScore | 0 | misfortunes × config.harshnessWeightMisfortune、(statusHits + crossBreaks) × config.harshnessWeightStatus、+ counters.harshness.bonus | Extra 判定と「本の要求」メーター |
| damageBy(enemy, filter) | 0 | `enemy.damageTaken` を tag / source で絞った合計 (アビリティ由来の累計、「スキル xx で与えた分」) | サンダーストーム系 |
| **派生リスト** startEntities | characters.start* | relic.startWith*, star.start* | run.start / 章リセット |
| chapterPanelSpecs(chapter) | chapter の enemy/equipment/item/ability/event Ids (placeholder は挑戦中 character の同 slot に解決) | characters.initial*, ownedPanels (event 含む), star.initial*, star.chapterEnemy [enemyId, 章番号] (章番号は本の chapterIds の 1 始まり、Extra は length + 1。R3 Q16), bookRule | 山札 |
| shopCandidates | 挑戦キャラの装備/アイテム/アビリティ + 共通/専用レリック | star.unlock* (locked の解放)、star.misfortuneCandidate [eventId] (呪われ体質の不利イベントをその他枠の候補に。価格は events.price。R3 Q17) | 幕間の抽選候補 |
| adjacent(entity) | — | インベントリで左右に接する実体 (右が空か、も)。隣接効果のパッシブが読む query。左右の指定は values ではなく type 名に織り込む (`powerIfRightEmpty`。R3 Q11) | 隣接効果 |
| **許可** canActivateEquipment(ent) | ok | status.paralyze (武器), passive.mustWithOtherWeapon, passive.onlyWithoutAbilityThisTurn, bookRule.armorForbidden, status.sleep | 装備 ON |
| canUseAbility(ent) | ready | status.arousal, status.sleep | |
| canUseItem(ent) | ok | item.executeAtMost (条件外), フェーズ (非戦闘は usableOutOfBattle のみ), status.sleep | |
| canAct | ok | status.sleep (手番スキップ、zzz 表示) | 攻撃ボタン |
| canFlee | ok | status.ds_crystal (結晶化: 逃げられない。UI はテクスチャ) | にげる ボタン |
| canRepairCostume | ok | status.ds_fever (体温上昇: 修復不可)。修復アイテム (tale の repairCostume) を移植するときはこれを通す | 衣装の修復 |
| canApplyStatus(target, key) | ok | side の不一致、他ヒロインの固有バステ → skip | 付与ガード |

内訳の例 (攻撃ボタンのツールチップ):

```
攻撃力 7
  基礎こうげき          3
  ぼろぼろソード       +3
  ウインドソード       +4
  半クロスブレイク     -1
  フルパワーモード     +1   (良性ステート)
  下限 0
```

## ctx の動詞 (横断規則はここに 1 回だけ書く)

| 動詞 | 規則 |
|---|---|
| `damagePlayer(n, {tag: enemyAttack/poison/event/self, pierceShield, source})` | シールドを先に削る (pierceShield なら貫通)。実際にライフが減った分だけ `turnMemo.damageTakenThisTurn` と recharge(damageTaken) を進める。`player.damaged` を発火 (眠りの解除はそこで status.sleep がやる)。0 以下で `battle.result = defeat` (ステップは settle が変える) |
| `damageEnemy(n, {ignoreBlock, pierceShield, tag: strike/item/ability/poison/self/lethal, source})` | ブロック (ignoreBlock で無視) → シールド (pierceShield で無視) → HP の順に削る。通ったダメージを `enemy.damageTaken` に発生源つきで 1 件積む (集計は派生 `damageBy`)。`enemy.damaged` を発火。HP が 0 以下になった瞬間に `battle.result = victory` と `enemy.killed` (ちょうど 0 なら `just`)。アイテム / アビリティの「直接ダメージ」は ignoreBlock だけ、貫通 (クナイ、pierce の一撃、毒、自傷、リーサルサイズ) は両方 |
| `heal(n, {source})` | 上限は maxHp。実回復 0 でも毒は全部消える (drain は実回復 1 以上のときだけ、passive 側で条件付け) |
| `applyStatus(target, key, value, {source})` | target は player か敵 (panelUid)。04 の付与規則 (side の一致 / stack 加算 / turn 上書き / unique 上書き / 他ヒロインならスキップ / star.badDuration)。player 側の bad なら counters.harshness.statusHits を進める |
| `removeStatus(target, key, {amount, cause})` | 共通ステートを amount ぶん減らす (省略で全部)。0 で消して `onExpire` → `statusExpire`。回避・好調の消費に使う |
| `addBuff(side, key, value, turns)` | statuses(kind=buff) の key。同 key は加算 (stackable)。turns = -1 はバトル中ずっと |
| `gain(kind, defId, {source, preferPos})` | 空きがあれば配置して `entity.gained`。無ければ `progress.pending` に積む。preferPos に入るならそこへ (R3 Q8 ツインソード) |
| `gainRelic(defId, {source})` | 同じ defId は 1 個まで。所持したら `relic.gained`。characters.startRelicIds / star.startRelic / ショップ / debug が全部これを通る |
| `spend(entity)` | 耐久 -1、0 で消して `entity.spent` |
| `recharge(type, amount, {excludeDefId})` | 休んでいるアビリティの progress を進め、達成で ready |
| `setCostume(key, cause)` / `crossBreak()` | 04 の遷移。crossBreak は unique 中は何もしない (イベント `crossBreakIgnored`)。衣装が実際に変わったときだけ `counters.harshness.crossBreaks += 1` |
| `emit(type, payload)` | 一発物を outbox に流す (state には残らない)。app の StepMover はこのステップで出た一発物の種別から待ち時間を決める |
| `memo(src, key, value?)` | src のスコープの memo に読み書き |
| `rand(n)` / `pick(list)` | state.rng を進める |

## イベント効果 (eventEffect) と選択肢の条件 (choiceCondition)

- eventEffect: `coins` (±)、`hp` (±。減少は `damagePlayer` tag=event)、`gainEquipment` / `gainItem` / `gainAbility`、`status` (value = statuses.id、value2 = 量。04 の付与規則を通る。R3 Q12)、`crossBreak`、`loseAllEntities` (インベントリを全部失う)、`loseAllCoins`、`harshness` (過酷さの直接加算)。tale の `wearCostume` / `loseEntity` は必要になったら
- `eventChoices.effects[i]` は `{type, value, value2}`。value2 を使うのは status だけ (他は無視)
- choiceCondition: `eventChoices.condition.type / condition.values`。`check(ctx, src)` が true のときだけ選べる (FTL の青選択肢。R2 Q23)。UI は query `eventChoices` の `available` で伏せ、コマンドは reason `choiceLocked`。v1: `wingsAndInventoryAtMost [maxSize]` (characters.wings かつ 占有マス合計 ≤ maxSize)

## レジストリの並び (同 order の同点解決)

```
statuses → costumes → bookRules → passives → relics → star → items → abilities → enemyActions → eventEffects → choiceConditions
```

tale のモジュールは全部は移植しない (R3 Q2)。ヒロインを足すときに必要になった分を 1 モジュール 1 ファイルで足す。契約点 (`onTake` / `fire` / `gain` の preferPos / `relic.gained` / `enemy.killed` / `enemy.attack.before` / `canFlee` / `canRepairCostume`) は先に用意してあるので、足すときにコアを触らずに済む。

family 内の並びも明示列挙。**ステートは並びが意味を持つ** (SD の重ね順・チップの順ではなくフックの同点解決の順)。

## 検証と可視化

- `queries/resolvedOrder(state, step)`: いまの装備・レリック・ステート・本のルールで、そのステップに並ぶハンドラを順に返す。インスペクタの「処理順ビューア」がこれを表示する
- `test/unit/order.test.js`: 代表的な組み合わせで期待順を固定
- `test/unit/effects/*.test.js`: 効果 1 つにつき 1 ファイル。モジュールと同じ名前
- `test/harness/runUntil(state, step)`: advance を `select` か `battle.end` まで回す。シナリオテストとボットが使う
- selftest: レジストリと全マスタの type/values/refs を突き合わせる

## 一発物 (outbox イベント) の型 (v1 案。実装で増減する)

`panelTake / panelDump / panelFall / panelRefill / bossAppear / chapterClear / rewards` /
`battleStart / turnStart / blitz / playerStrike / enemyBlocked / drainHeal / poisonApply / weaponWear / equipBreak / itemUse / itemBreak / abilityUse / abilityReady / abilityBreak / delayedSet / delayedFire / selfBuff / enemyDebuff / shieldGain / heal / poisonCured` /
`statusApply / statusSkipped / statusDecay / statusExpire / uniqueApply / uniqueExpire / costumeChange / crossBreak / crossBreakIgnored / sleepSkip / sleepCured / confusionShuffle / confusionDeactivate / weaponsForcedOff / attachOff` /
`enemyRoutineStart / enemyStunned / enemyAttack / enemyAttackNegated / enemyBlock / enemyShield / enemyShieldAbsorb / enemyRest / enemySelfHarm / enemyPoisonTick / parry / enemyStunApply` /
`playerPoisonTick / playerDamage / relicProc / passiveProc / bookRuleProc / harshnessGain / victory / defeat / fleeStart / fleeDone / gain / pendingGain / coinGain / loseEntities` /
`lethalScythe (リーサルサイズ発動の専用フラグメント) / justLethal / evade / statusConsume / relicGain`
