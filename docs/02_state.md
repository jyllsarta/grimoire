# 02 ラン状態 (GameState)

ラン (1 回の挑戦) の状態は 1 本の JSON ツリー `GameState` だけで表す。**これがコアロジックの正本で、厳密レビューの対象**。
ここに無いものはゲームの状態ではない (画面の状態、演出中フラグ、オプションは app 側)。進行データ (ラン外) は 06_save。

## 原則

1. **プレーンな JSON**。クラスインスタンス、関数、`undefined`、循環参照を持たない。`structuredClone` と `JSON.stringify` でそのまま複製・保存できる
2. **参照共有なし**。オブジェクト間の関係は uid か マスタ id で指す。敵の状態は盤面パネルに置き、戦闘は `panelUid` で指す
3. **語彙は key、カタログは id**。ステート・衣装・バフ・本のルールのような「語彙」は文字列 key で持つ (インスペクタとセーブが読める)。装備・アイテム・アビリティ・敵・レリック・イベントのような「カタログ」はマスタの数値 id で持つ。ロジックは id の値で分岐しない
4. **派生値は持たない**。最大ライフ、攻撃力、ブロック値、スロット数、フェーズは毎回計算する (03 の派生値)。二重管理を避ける
5. **スコープで置き場を決める**。章をまたいで残るものは `heroine` / `inventory` / `wallet` / `relics`、章の中だけは `board`、バトルの中だけは `battle`、ターンの中だけは `battle.turnMemo`
6. **モジュール固有の記憶は memo に閉じ込める**。効果モジュールが覚えておきたい値 (腐るまでの戦闘数、コマンド時の HP など) は各スコープの `memo` に `"<family>.<key>"` を名前空間にして書く。インスペクタでそのまま見える
7. **保留は state に置く**。インベントリあふれのような「UI の応答待ち」は `progress.pending` に置き、解決コマンドで消す。途中でセーブしても再開できる

## 全体像

```
GameState
├ schemaVersion            1
├ meta                     { createdAt, updatedAt, appVersion, edition, difficulty }
├ rng                      { seed, s: [u32 ×4] }              決定的乱数 (xoshiro128**)。全部の抽選がここを進める
├ uidNext                  次に発行する uid
├ heroineId, bookId        挑戦中のヒロインと本 (マスタ id)
├ star                     { activeNodeIds, delta, effects: [{nodeId, type, values}], crownsGained }  ラン開始時のスナップショット。ラン中固定
├ progress                 { chapterIndex, stage: main|extra, ending: null|normal|happy|lose, pending: [...] }
├ heroine                  { hp, statuses: [{key, value}], unique: null|{key, turns}, costume }
├ wallet                   { coin, jewel, crown }
├ relics                   [{ uid, defId, memo }]
├ inventory                { entities: [{ uid, kind, defId, pos, durability, active?, ready?, progress?, memo }], concealed }
├ ownedPanels              [{ kind, defId }]                     幕間で買った所持済パネル (設計図)
├ board                    { chapterId, width, cells: [uid|null], panels: {uid: PanelInstance}, pool: [uid], boss: {uid, placed, defeated} }
├ battle                   null | { panelUid, turn, started, result, shield, buffs, delayed, turnMemo, memo }
├ shop                     null | { slots: [{kind, defId, soldOut, rare}], rerolls }
├ counters                 { harshness: {misfortunes, statusHits}, battles, kills, turns, flees, chaptersCleared }
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
| uidNext | int | インスタンス (パネル、実体、レリック) の連番。1 から | uid.js | — |
| heroineId / bookId | int | characters.id (role=heroine) / books.id | newRun | — |

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
| chapterIndex | int | `books.chapterIds` の添字 (0 始まり)。stage が extra のときは最終章の値のまま |
| stage | `main` / `extra` | Extra Chapter に入ったら extra。現在の章 id は `currentChapterId(state)` (query) が `stage` と `chapterIndex` から決める |
| ending | null / `normal` / `happy` / `lose` | 決まったらラン終了。core は scene を知らないので、app が ending を見てリザルトへ遷移する |
| pending | PendingRequest[] | UI の応答待ち。先頭から順に解決する。空でなければ `resolvePending` 以外のコマンドは拒否 |

PendingRequest (v1 は 1 種類):

```
{ kind: "gain", entity: Entity (pos = -1), source: SourceRef }   // インベントリに入り切らなかった獲得物。解決 = 配置 (arrangement) か 受け取らない (discard)
```

### heroine (章をまたぐヒロインの状態)

| フィールド | 型 | 意味 | リセット |
|---|---|---|---|
| hp | int | 現在ライフ。0 で敗北。上限は派生値 `maxHp` | ランを通して持ち越し |
| statuses | `{key, value}[]` | 共通ステート (バステと良性ステート)。key は statuses.key (kind=common)。value はそのステートの `duration` により **スタック数** (stack) / **残り行動回数** (turn) / **量** (permanent)。同じ key は 1 エントリだけ。並びは付与順 (表示順はマスタの order で並べ直す) | 章クリアで空 |
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

幕間で買った「所持済パネル」の設計図 `{kind, defId}`。章を組むたびに新しい実体として山札に入る。

### board (章の盤面)

| フィールド | 型 | 意味 |
|---|---|---|
| chapterId | int | chapters.id (Extra Chapter も同じ形) |
| width | int | 列数。盤面は width×2 |
| cells | (uid/null)[] | 長さ width×2。`0..width-1` が下段 (選べる)、`width..2width-1` が上段 (ネクスト)。列 c の上段は `c + width` |
| panels | `{ [uid]: PanelInstance }` | 盤面と山札にある全パネル (取り除かれたら消す) |
| pool | uid[] | 山札。順序に意味はなく、補充は rng で 1 つ選ぶ。公開情報 (内容と枚数) |
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
| buffs | `{key, value, turns}[]`。敵側のバトルバフ (攻撃力ダウン等)。**バトルが終わっても残す** (逃走時の状態保持のため。仕様は R2) |
| poison | 敵の毒スタック (敵に付く唯一のステート) |
| abilityDamageTaken | 受けたアビリティ由来ダメージの累計 (サンダーストーム系が読む) |
| memo | モジュール記憶 |

### battle (バトル中だけ)

| フィールド | 型 | 意味 |
|---|---|---|
| panelUid | int | 戦っている敵パネル。敵の状態は `board.panels[panelUid].enemy` |
| turn | int | 1 始まり。ターン終了で +1 |
| started | bool | 最初のターン消費行動 (攻撃 / 逃走 / フリーアクション) をしたら true。false の間はキャンセル無料 |
| result | null / `victory` / `flee` / `defeat` | 決まったらバトルは終了扱い。`closeBattle` で battle が null に戻る (勝利なら盤面の処理は result 確定時に済んでいる) |
| shield | int | このバトル中のシールド。ライフより先に削られる (毒は貫通) |
| buffs | `{key, value, turns}[]` | ヒロイン側のバトルバフ。key は statuses.key (kind=buff)。turns は「自分の行動回数」で減る |
| delayed | `{source, key, values}[]` | 次のターン開始時に発動する予約 (ディレイ系)。バトル終了で消える |
| turnMemo | object | このターンだけの記憶。ターン終了で `{}`。既知キー: `abilitiesUsed`, `damageTakenThisTurn`, `skipHeroine` (眠りで手番スキップ)。モジュールは名前空間付きで追加できる |
| memo | object | このバトルだけの記憶 |

### shop (幕間だけ)

`{ slots: [{kind: equipment|item|ability|relic, defId, soldOut, rare}], rerolls }`。抽選規則はプロト踏襲 (05 の config と 03 の派生値 `shopLayout`)。

### counters (ラン内の累計)

| フィールド | 意味 |
|---|---|
| harshness.misfortunes | 再生した不利イベントの回数 |
| harshness.statusHits | バトル中に状態異常を付与された回数 (数え方は R2) |
| battles / kills / turns / flees / chaptersCleared | 統計と実績・ゲート判定用 |

過酷さの判定 = `harshness` と `books.harshnessThreshold` を派生値 `harshnessScore` で比べる (式は R2)。

### memo

ラン全体のモジュール記憶。例: `"bookRule.armorForbidden"` は記憶不要、`"relic.powerOnKill": {count: 2}`。

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
| newRun(heroineId, bookId, starSnapshot, difficulty, seed) | (state なし) | 全部 |
| takePanel(cell) / takePanelArranged(cell, arrangement) / dumpPanel(cell) | chapter | board, inventory, wallet, pending |
| startBattle(cell) | chapter | battle |
| chooseEvent(cell, choiceIndex) | chapter | board, wallet, heroine, inventory, counters, pending |
| takeChapterClear(cell) | chapter | wallet, heroine, inventory, shop / progress, board (Extra) |
| arrangeInventory(arrangement) | chapter, intermission | inventory |
| useItem(uid) | battle (chapter も可にする案 [R2]) | heroine, battle, inventory, board.panels[].enemy |
| toggleEquip(uid) / useAbility(uid) | battle | inventory, battle, enemy |
| attack() / flee() | battle | ほぼ全部 |
| cancelBattle() | battle (started=false) | battle=null |
| closeBattle() | battle (result != null) | battle=null |
| resolvePending(index, arrangement or discard) | pending | inventory, pending |
| buyShopSlot(i) / rerollShop() / buyHeal() | intermission | shop, wallet, ownedPanels, relics, heroine.hp |
| enterNextChapter() | intermission | progress, board, wallet, inventory, shop=null |
| giveUp() | chapter, intermission | ending=lose [R2] |

コマンドは `{ ok: true, events }` か `{ ok: false, reason }` を返す。reason は systemTexts のキーになる語 (`coins`, `paralyze`, `mustWithOtherWeapon` ...)。

## イベントと BattleView

コマンドが返す `events` は `{ type, ...payload, view? }` の配列。`view` は戦闘の表示に必要な値のスナップショット (BattleView) で、戦闘中に表示が変わるイベントに付く。UI は演出中 `view` を描き、演出が終わったら `current` を描く。

```
BattleView {
  turn,
  heroine: { hp, shield, statuses, unique, costume, buffs },
  enemy:   { hp, block, poison, stunned, routineIndex, buffs },
  delayed,
  inventory: [{ uid, durability, active, ready, progress }],
  wallet: { coin },
}
```

イベント型の一覧 (v1 案) は 03 の末尾。

## 画面と state の対応

「画面を見て state を言える」ための対応表。UI は必ずこの対応で描く (別の場所に同じ値を持たない)。

| 画面の要素 | state |
|---|---|
| 左上の章名 / 本名 | `bookId`, `currentChapterId(state)` → マスタ |
| 残パネル / 残モンスター数 | `board.pool` の内訳 + `board.cells` + `board.boss.placed` |
| ライフ数値と目盛 | `heroine.hp` / 派生 `maxHp` |
| レリック列 | `relics[]` |
| ステートチップ列 | `heroine.statuses` + `heroine.unique` + (`heroine.costume` が normal 以外ならそのチップ、unique 中は非表示) |
| コイン (菱形) | `wallet.coin` |
| 盤面 (幅×2) | `board.cells[i]` → `board.panels[uid]` |
| 敵パネルの HP / 毒 / 予告 | `board.panels[uid].enemy.hp / poison / routineIndex` |
| インベントリ帯 | `inventory.entities` (pos, active, durability, ready, progress)、`inventory.concealed` |
| 戦闘: ライフ / シールド | `heroine.hp` / `battle.shield` |
| 戦闘: 敵 HP / ブロック / 毒 / スタン / 予告 / 行動メモ | `board.panels[battle.panelUid].enemy.*` + マスタ enemyActions |
| 戦闘: ターン / 予約チップ / バフチップ | `battle.turn` / `battle.delayed` / `battle.buffs`, `enemy.buffs` |
| 攻撃ボタンの予測値 | 派生 `attackPower` の内訳 |
| 幕間: ジュエル / クラウン / ショップ / 次章の山札 | `wallet.jewel / crown` / `shop.slots` / 派生 `chapterPanelSpecs(次章)` |
| 強制整理ダイアログ | `progress.pending[0]` |
| 過酷さメーター | `counters.harshness` と `books.harshnessThreshold` |
| リザルト | `progress.ending`, `star`, `counters` |

## 不変条件 (テストとインスペクタが毎コマンド検査する)

- `heroine.hp` は 0 以上 `maxHp` 以下。`wallet.*` は 0 以上
- `inventory.entities` の占有マスが重ならず、`0 <= pos` かつ `pos + size <= slotCount`。pending 中の実体だけ pos=-1 で、それは `inventory.entities` に含まれない
- `board.cells` の uid と `board.pool` の uid は重複せず、全部 `board.panels` にある。`panels` に孤児 (どこにもいない uid) がない
- `battle.panelUid` は `board.cells` のどれかで、そのパネルは kind=enemy
- `heroine.statuses` の key は重複しない。value は 1 以上 (0 になったら消す)。`unique` の turns は 1 以上
- `heroine.unique` が他ヒロインの固有バステを指さない (付与時にスキップ済み)
- `progress.pending` が空でない間は phase=pending
- 全部のフィールドが JSON で往復して同値 (`JSON.parse(JSON.stringify(s))` が deepEqual)
- `uidNext` は既存の全 uid より大きい

## 例: 「毒3, 眠り1, 発情5, ねばねば3, 固有1バステが2, 半クロスブレイク」

```json
"heroine": {
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
