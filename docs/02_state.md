# 02 ラン状態 (GameState)

ラン (1 回の挑戦) の状態は 1 本の JSON ツリー `GameState` だけで表す。**これがコアロジックの正本で、厳密レビューの対象**。
ここに無いものはゲームの状態ではない (画面の状態、演出中フラグ、選択中の対象、オプションは app 側)。進行データ (ラン外) は 06_save。

## 原則

1. **プレーンな JSON**。クラスインスタンス、関数、`undefined`、循環参照を持たない。`JSON.stringify` でそのまま保存できる。app は Vue の `reactive` で包んで晒し、core は包まれているかどうかを気にしない (01 の Proxy 3 規則)
2. **実物は 1 本**。UI が読むのは常にこの state で、表示用の写しは作らない
3. **参照共有なし**。オブジェクト間の関係は uid か マスタ id で指す。敵の状態は盤面パネルに置き、戦闘は `panelUid` で指す
4. **語彙は key、カタログは id**。ステート・衣装・バフ・本のルールのような「語彙」は文字列 key で持つ (インスペクタとセーブが読める)。装備・アイテム・アビリティ・敵・レリック・イベントのような「カタログ」はマスタの数値 id で持つ。ロジックは id の値で分岐しない
5. **派生値は持たない**。最大ライフ、攻撃力、ブロック値、スロット数、フェーズは毎回計算する (03 の派生値)。二重管理を避ける
6. **スコープで置き場を決める**。章をまたいで残るものは `player` / `inventory` / `wallet` / `relics`、章の中だけは `board`、バトルの中だけは `battle`、ターンの中だけは `battle.turnMemo`
7. **モジュール固有の記憶は memo に閉じ込める**。効果モジュールが覚えておきたい値 (腐るまでの戦闘数、コマンド時の HP など) は各スコープの `memo` に `"<family>.<key>"` を名前空間にして書く。インスペクタでそのまま見える
8. **保留は state に置く**。インベントリあふれのような「UI の応答待ち」は `progress.pending` に置き、解決コマンドで消す。途中でセーブしても再開できる
9. **バトルの進行も state に置く**。`battle.step` がターンのどこまで進んだかを持ち、`advance` が 1 つ進める。演出の途中でセーブしても続きから再開できる
10. **命名**: 00 の規則。`characterId` は同一性、`player` / `enemy` は側。state の中に heroine という語は出ない

## 全体像

```
GameState
├ schemaVersion            1
├ meta                     { createdAt, updatedAt, appVersion, edition, difficulty }
├ rng                      { seed, s: [u32 ×4] }              決定的乱数 (xoshiro128**)。全部の抽選がここを進める
├ uidNext                  次に発行する uid (10001 から。見て uid と分かる値域)
├ characterId, bookId      挑戦中のヒロイン (characters.id) と本 (books.id)
├ star                     { activeNodeIds, delta, effects: [{nodeId, type, values}], crownsGained }  ラン開始時のスナップショット。ラン中固定
├ progress                 { chapterIndex, stage: main|extra, ending: null|normal|happy|lose|abandoned, pending: [...] }
├ player                   { hp, statuses: [{key, value}], unique: null|{key, turns}, costume }   挑戦中 character の駒の状態
├ wallet                   { coin, jewel, crown }
├ relics                   [{ uid, defId, memo }]
├ inventory                { entities: [{ uid, kind, defId, pos, durability, active?, ready?, progress?, memo }], concealed }
├ ownedPanels              [{ kind, defId }]                     幕間で買った所持済パネル (設計図。不利イベントも可)
├ board                    { chapterId, width, cells: [uid|null], panels: {uid: PanelInstance}, deck: [uid], boss: {uid, placed, defeated} }
├ battle                   null | { panelUid, step, cursor, turn, started, result, shield, buffs, delayed, turnMemo, memo }
├ shop                     null | { slots: [{kind, defId, soldOut, rare}], rerolls }
├ counters                 { harshness: {misfortunes, statusHits, crossBreaks}, battles, kills, turns, flees, chaptersCleared }
└ memo                     ラン全体のモジュール記憶
```

## 各フィールド

### ルート

| フィールド | 型 | 意味 | 書く人 | リセット |
|---|---|---|---|---|
| schemaVersion | int | セーブ互換のための版。06 のマイグレーションが見る | run.js | — |
| meta.createdAt / updatedAt | ISO 文字列 | 作成・最終更新。updatedAt はコマンドごとに更新 | dispatch | — |
| meta.appVersion / edition | string | 作られたアプリの版とエディション (表示と互換判定用) | run.js | — |
| meta.difficulty | `easy`/`normal`/`hard`/null | プリセットで選んだ難易度の表示用ラベル。効果は star に焼き込み済みなのでロジックは見ない | newRun | — |
| rng.seed | int | ラン開始時のシード (表示・再現用) | newRun | — |
| rng.s | u32[4] | xoshiro128** の内部状態。乱数を引くたびに進む。**Math.random は core で禁止** | rng.js | — |
| uidNext | int | インスタンス (パネル、実体、レリック) の連番。**10001 から** (知らない値を見たとき uid と判別できるように) | uid.js | — |
| characterId / bookId | int | characters.id (本を持つ character = ヒロイン) / books.id | newRun | — |

### star (スターパレットのスナップショット)

| フィールド | 型 | 意味 |
|---|---|---|
| activeNodeIds | int[] | ラン開始時に有効だったノード。リザルトで表示 |
| delta | int | 変動値の合計 (ゲート判定とベスト記録に使う) |
| effects | `{nodeId, type, values}[]` | 有効ノードの効果をそのまま並べたリスト。**フラットな合計値は持たない**。合計は 03 の派生値 (`maxHp` など) が effects を寄与として読む |
| crownsGained | int | このランで得たクラウンの累計 (進行データの累計クラウンに足す) |

### progress

| フィールド | 型 | 意味 |
|---|---|---|
| chapterIndex | int | 章の列の添字 (0 始まり)。章の列 = `chapterSequence(state)` = `books.chapterIds` に、stage が extra なら `books.extraChapterId` を末尾に足したもの。Extra Chapter にいる間は `chapterIndex === chapterIds.length` |
| stage | `main` / `extra` | 最終章クリア時に過酷さが閾値以上なら extra になる (その時点ではまだ幕間。`enterNextChapter` で Extra Chapter に入る)。現在の章 id は `currentChapterId(state)` = `chapterSequence(state)[chapterIndex]` |
| ending | null / `normal` / `happy` / `lose` / `abandoned` | 決まったらラン終了。normal = 最終章クリアで閾値未達、happy = Extra Chapter のクリア、lose = 敗北 (Extra での敗北も lose だが戦績にはノーマル完走も残す)、abandoned = 自分で破棄 (戦績に数えない)。core は scene を知らないので、app が ending を見てリザルトへ遷移する |
| pending | PendingRequest[] | UI の応答待ち。先頭から順に解決する。空でなければ `resolvePending` 以外のコマンドは拒否 |

PendingRequest (v1 は 1 種類):

```
{ kind: "gain", entity: Entity (pos = -1), source: SourceRef }   // インベントリに入り切らなかった獲得物。解決 = 配置 (arrangement) か 受け取らない (discard)
```

### player (挑戦中 character の駒。章をまたぐ状態)

| フィールド | 型 | 意味 | リセット |
|---|---|---|---|
| hp | int | 現在ライフ。0 で敗北。上限は派生値 `maxHp` | ランを通して持ち越し |
| statuses | `{key, value}[]` | 共通ステート (バステと良性ステート)。key は statuses.key (kind=common、side が player / both)。value はそのステートの `duration` により **スタック数** (stack) / **残り行動回数** (turn) / **量** (permanent)。同じ key は 1 エントリだけ。並びは付与順 (表示順はマスタの order で並べ直す) | 章クリアで空 |
| unique | null / `{key, turns}` | 固有バステ。**最大 1 つ**。付与は上書き。turns は残り行動回数 | 章クリアで null |
| costume | string | 衣装の key (`normal` / `half` / `full` / `special1` ...)。statuses(kind=costume).key。unique が付いている間は表示も効果も **マスクされる** (04) | 章クリアで normal |

### wallet

| フィールド | 意味 | リセット |
|---|---|---|
| coin | 章内通貨。敵撃破・パネル破棄で増え、パネル回収で減る | 章クリアで 0 (ジュエルに換算) |
| jewel | 幕間通貨。章クリア時に加算 | 持ち越し |
| crown | 幕間通貨その 2。章クリア時に加算、レアレリックに使う | 持ち越し |

### relics

`{ uid, defId, memo }` の配列。defId = relics.id。同じ defId は 1 個まで。memo はそのレリックのモジュール記憶 (例: 発動回数)。

### inventory

| フィールド | 型 | 意味 |
|---|---|---|
| entities | Entity[] | 所持している実体。`pos` は左端のマス (0 始まり)。占有幅はマスタの size。重なりは不変条件で禁止 |
| concealed | bool | 混乱中 = true。UI は全部を ??? で描く。state 自体は正しい値を持つ (インスペクタでは見える) |

Entity:

| フィールド | 型 | 意味 |
|---|---|---|
| uid | int | 実体の id |
| kind | `equipment` / `item` / `ability` | どのテーブルの定義か。**id の値で判定しない** |
| defId | int | 定義 id |
| pos | int | 左端マス。`progress.pending` にいる間だけ -1 |
| durability | int | 残り回数。-1 = 無限 |
| active | bool | equipment のみ。ON/OFF (ターンをまたいで維持) |
| ready / progress | bool / int | ability のみ。使えるか / リチャージ進捗 |
| memo | object | モジュール記憶 (例: `"bookRule.foodRot": {battlesLeft: 5}`) |

スロット数は派生値 `slotCount` (config.startSlots + レリック + スター)。

### ownedPanels

幕間で買った「所持済パネル」の設計図 `{kind, defId}`。kind は equipment / item / ability / event (呪われ体質の不利イベント)。章を組むたびに新しい実体として山札に入る。

### board (章の盤面)

| フィールド | 型 | 意味 |
|---|---|---|
| chapterId | int | chapters.id (Extra Chapter も同じ形) |
| width | int | 列数。盤面は width×2 |
| cells | (uid/null)[] | 長さ width×2。`0..width-1` が下段 (選べる)、`width..2width-1` が上段 (ネクスト)。列 c の上段は `c + width` |
| panels | `{ [uid]: PanelInstance }` | 盤面と山札にある全パネル (取り除かれたら消す) |
| deck | uid[] | 山札。順序に意味はなく、補充は rng で 1 つ選ぶ。公開情報 (内容と枚数) |
| boss | `{uid, placed, defeated}` | ボスパネル。山札が空になったら placed=true で上段に補充される |

PanelInstance:

```
{ uid, kind: enemy|equipment|item|ability|event|chapterClear, defId: int|null, isBoss: bool, enemy?: EnemyState }
```

EnemyState (kind=enemy のときだけ。**逃走してもここに残る**):

| フィールド | 意味 |
|---|---|
| hp | 残りライフ (生成時に派生値 `enemyMaxHp(defId)` = マスタ hp + スター補正) |
| routineIndex | 次に実行するルーチンの番号 (enemyActions の order 順で回る) |
| stunned | 次の行動をスキップするか (パリィ / スタン付与) |
| block | このラウンドのブロック (自分の行動開始で 0 に戻る) |
| statuses | `{key, value}[]`。敵側のステート (player.statuses と同じ形。statuses.side が enemy / both のもの)。v1 は毒だけだが、時止め・恒久攻撃力ダウンなどプレイヤー側の能力で付くものが増える前提。**逃走しても残す** (初期仕様 Q18「HP・ルーチン・ブロック・毒など全部そのまま残す」) |
| buffs | `{key, value, turns}[]`。敵側のバトルバフ (攻撃力ダウン等)。同じく逃走しても残す |
| damageTaken | `{tag, source: {family, key, defId, uid}, amount, turn}[]`。受けたダメージを **1 発ずつ発生源つき** で記録する (「スキル xx で与えたダメージの半分を与える」のような参照のため)。アビリティ由来の累計などは query が集計する。逃走しても残す |
| memo | モジュール記憶 |

### battle (バトル中だけ)

| フィールド | 型 | 意味 |
|---|---|---|
| panelUid | int | 戦っている敵パネル。敵の状態は `board.panels[panelUid].enemy` |
| step | string | **ターンのどこまで進んだか** (03 のバトルステップ名がそのまま入る)。`select` が入力待ち、`battle.end` が終端。それ以外は app の StepMover が `advance` で進める責任を持つ |
| cursor | int | `enemy.action` で次に解決するアクションの添字 (0 始まり)。他のステップでは 0 |
| turn | int | 1 始まり。`turn.end` で +1 |
| started | bool | 最初のターン消費行動 (攻撃 / 逃走 / フリーアクション) をしたら true。false の間はキャンセル無料 |
| result | null / `victory` / `flee` / `defeat` | 動詞 (`damagePlayer` / `damageEnemy`) と `flee.done` が立てる。立ったら次の settle 点で step が `battle.victory` / `battle.defeat` / `battle.end` に移る (03) |
| shield | int | このバトル中のシールド。ライフより先に削られる (毒は貫通) |
| buffs | `{key, value, turns}[]` | プレイヤー側のバトルバフ。key は statuses.key (kind=buff)。turns は「自分の行動回数」で減る |
| delayed | `{source, key, values}[]` | 次のターン開始時に発動する予約 (ディレイ系)。バトル終了で消える |
| turnMemo | object | このターンだけの記憶。`turn.end` で `{}`。既知キー: `order` (player / enemy。`turn.order` が決める)、`skipPlayer` (眠りで手番スキップ)、`fleeing` (逃走中)、`abilitiesUsed`、`damageTakenThisTurn`。モジュールは名前空間付きで追加できる |
| memo | object | このバトルだけの記憶 |

### shop (幕間だけ)

`{ slots: [{kind: equipment|item|ability|event|relic, defId, soldOut, rare}], rerolls }`。抽選規則はプロト踏襲 (05 の config と 03 の派生値 `shopLayout`)。event はスターパレットの不利ノードで候補に入った呪われ体質の不利イベント (買うと ownedPanels に入る)。

### counters (ラン内の累計)

| フィールド | 意味 |
|---|---|
| harshness.misfortunes | 再生した不利イベントの回数 |
| harshness.statusHits | 状態異常 (bad) を付与された回数。重ね掛けも各 1、固有バステも含む、他ヒロインのスキップは数えない |
| harshness.crossBreaks | クロスブレイクで衣装状態が実際に変わった回数 (full → full や固有バステ中の無効化は数えない) |
| battles / kills / turns / flees / chaptersCleared | 統計と実績・ゲート判定用 |

過酷さの判定 = 派生値 `harshnessScore` (= misfortunes × config.harshnessWeightMisfortune + (statusHits + crossBreaks) × config.harshnessWeightStatus) と `books.harshnessThreshold` を比べる。

### memo

ラン全体のモジュール記憶。例: `"bookRule.armorForbidden"` は記憶不要、`"relic.powerOnKill": {count: 2}`、`"status.confusion": {pendingDeactivate: true}` (次の turn.start で全装備 OFF する予約)。

## フェーズ (派生) とコマンド許可

`phaseOf(state)`:

```
ending != null           → ended
progress.pending.length  → pending
battle != null           → battle
shop != null             → intermission
それ以外                 → chapter
```

| コマンド | 許可フェーズ | 変えるもの |
|---|---|---|
| newRun(characterId, bookId, starSnapshot, difficulty, seed) | (state なし) | 全部 |
| takePanel(cell) / takePanelArranged(cell, arrangement) / dumpPanel(cell) | chapter | board, inventory, wallet, pending |
| startBattle(cell) | chapter | battle (step = `battle.start`) |
| chooseEvent(cell, choiceIndex) | chapter | board, wallet, player, inventory, counters, pending |
| takeChapterClear(cell) | chapter | wallet, player, inventory, counters, そして shop (次章あり) か progress (最終章: 過酷さ判定で 達成 → stage=extra + shop / 未達 → ending=normal。Extra の章なら ending=happy) |
| arrangeInventory(arrangement) | chapter, intermission | inventory |
| useItem(uid) | battle (step = select)。`items.usableOutOfBattle` のものは chapter / intermission でも | player, battle, inventory, board.panels[].enemy |
| toggleEquip(uid) / useAbility(uid) | battle (step = select) | inventory, battle, enemy |
| attack() | battle (step = select) | step = `turn.command`、started |
| flee() | battle (step = select) | step = `flee.command`、started |
| advance() | battle (step が select でも battle.end でもない) | そのステップの分だけ (03)。1 回で 1 ステップ |
| cancelBattle() | battle (step = select、started=false) | battle=null |
| closeBattle() | battle (step = battle.end) | battle=null |
| resolvePending(index, arrangement or discard) | pending | inventory, pending |
| buyShopSlot(i) / rerollShop() / buyHeal() | intermission | shop, wallet, ownedPanels, relics, player.hp |
| enterNextChapter() | intermission | progress (chapterIndex += 1)、board (次の章。stage が extra なら Extra Chapter)、wallet, inventory, shop=null |
| giveUp() | chapter, intermission | ending=abandoned (戦績に数えない) |

コマンドは `{ ok: true }` か `{ ok: false, reason }` を返す。reason は systemTexts のキーになる語 (`coins`, `paralyze`, `mustWithOtherWeapon` ...)。一発物 (演出・音の要求) は返り値ではなく outbox に流れる (03「ctx の動詞」の `emit`)。

## 画面と state の対応

「画面を見て state を言える」ための対応表。UI は必ずこの対応で描く (別の場所に同じ値を持たない)。

| 画面の要素 | state |
|---|---|
| 左上の章名 / 本名 | `bookId`, `currentChapterId(state)` → マスタ |
| 残パネル / 残モンスター数 | `board.deck` の内訳 + `board.cells` + `board.boss.placed` |
| ライフ数値と目盛 | `player.hp` / 派生 `maxHp` |
| レリック列 | `relics[]` |
| ステートチップ列 | `player.statuses` + `player.unique` + (`player.costume` が normal 以外ならそのチップ、unique 中は非表示) |
| コイン (菱形) | `wallet.coin` |
| 盤面 (幅×2) | `board.cells[i]` → `board.panels[uid]` |
| 敵パネルの HP / ステートチップ / 予告 | `board.panels[uid].enemy.hp / statuses / routineIndex` |
| インベントリ帯 | `inventory.entities` (pos, active, durability, ready, progress)、`inventory.concealed` |
| 戦闘: ライフ / シールド | `player.hp` / `battle.shield` |
| 戦闘: 敵 HP / ブロック / ステート / スタン / 予告 / 行動メモ | `board.panels[battle.panelUid].enemy.*` + マスタ enemyActions |
| 戦闘: ターン / 予約チップ / バフチップ | `battle.turn` / `battle.delayed` / `battle.buffs`, `enemy.buffs` |
| 戦闘: いま何が起きているか (入力待ちか、演出中か、どの敵アクションか) | `battle.step` / `battle.cursor` / `battle.turnMemo.order` |
| 攻撃ボタンの予測値 | 派生 `attackPower` の内訳 |
| 攻撃ボタンの zzz 表示 (眠り) | 許可 `canAct` (= `player.statuses` の sleep) |
| 幕間: ジュエル / クラウン / ショップ / 次章の山札 | `wallet.jewel / crown` / `shop.slots` / 派生 `chapterPanelSpecs(次章)` |
| 強制整理ダイアログ | `progress.pending[0]` |
| 過酷さメーター (本の要求) | 派生 `harshnessScore` (← `counters.harshness`) と `books.harshnessThreshold` |
| 本のルールの表示 | `bookId` → マスタ bookRules |
| リザルト | `progress.ending`, `star`, `counters` |

## 不変条件 (テストとインスペクタが毎コマンド検査する)

- `player.hp` は 0 以上 `maxHp` 以下。`wallet.*` は 0 以上
- `inventory.entities` の占有マスが重ならず、`0 <= pos` かつ `pos + size <= slotCount`。pending 中の実体だけ pos=-1 で、それは `inventory.entities` に含まれない
- `board.cells` の uid と `board.deck` の uid は重複せず、全部 `board.panels` にある。`panels` に孤児 (どこにもいない uid) がない
- `battle.panelUid` は `board.cells` のどれかで、そのパネルは kind=enemy (`battle.result` が victory のときは例外: `battle.victory` の boardUpdate でパネルは取り除かれるか chapterClear に変わり、`closeBattle` を待つ)
- `battle.step` は 03 のバトルステップ名のどれか。`cursor` は `enemy.action` のときだけ 0 以上 actions.length 以下、他は 0。`result` が立っているのに step が select のままになることはない
- `player.statuses` の key は重複しない。value は 1 以上 (0 になったら消す)。`unique` の turns は 1 以上。敵の `statuses` も同じ
- `player.unique` が他ヒロインの固有バステを指さない (付与時にスキップ済み)
- `progress.pending` が空でない間は phase=pending
- 全部のフィールドが JSON で往復して同値 (`JSON.parse(JSON.stringify(s))` が deepEqual)
- `uidNext` は既存の全 uid より大きく、10001 以上
- `progress.stage` が main なら `chapterIndex < chapterIds.length`、extra なら `chapterIndex <= chapterIds.length`

## 例: 「毒3, 眠り1, 発情5, ねばねば3, 固有1バステが2, 半クロスブレイク」

```json
"player": {
  "hp": 17,
  "statuses": [
    { "key": "poison",  "value": 3 },
    { "key": "sticky",  "value": 3 },
    { "key": "arousal", "value": 5 },
    { "key": "sleep",   "value": 1 }
  ],
  "unique": { "key": "ds_unique1", "turns": 2 },
  "costume": "half"
}
```

- チップ列は statuses (マスタ order で並べ替え: 毒 → 眠り → 発情 → ねばねば) + 固有 (ds_unique1: 2)。衣装チップは unique 中なので出ない
- SD は 固有バステの衣装レイヤー (`unique_ds_unique1.png`) + 表情 + 共通バステの重ね (毒 → 眠り → 発情 → ねばねば)
- 攻撃力の内訳に「半クロスブレイク -1」は **出ない** (マスク中)。固有バステが切れたら `costume: "half"` がそのまま復活して出る
- 攻撃ボタンは zzz。押すと `battle.step` が `turn.command` → `player.tick` (毒 3 ダメージ、毒 3 → 2) → `turn.order` → `player.act.skipped` → `player.act.end` (眠り 1 → 0、発情 5 → 4、ねばねば 3 → 2、固有 2 → 1) → `enemy.act.begin` → … と 1 つずつ進み、画面はそのたびに実物の state を描く
