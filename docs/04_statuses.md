# 04 ステート (状態異常・衣装・良性ステート・バフ)

すべて `statuses` マスタの行で、効果は `status` family のモジュールで表す。state 上の置き場と持続の規則は種類で決まる。側の名前は player / enemy (00 の命名規則)。

## 種類

| kind | state の置き場 | scope | 例 |
|---|---|---|---|
| common | `player.statuses[{key, value}]` (複合可) | 章 | 毒、眠り、麻痺、発情、ねばねば、混乱、良性ステート (power, abilityDamage) |
| common (敵側) | `board.panels[uid].enemy.statuses[{key, value}]` | パネルが盤面にある間 | 毒 (side=both)。今後プレイヤー側の能力で付ける敵専用ステート (時止め、恒久攻撃力ダウンなど) |
| unique | `player.unique {key, turns}` (最大 1 つ、上書き) | 章 | ヒロインごとの固有バステ 2 種 |
| costume | `player.costume` (key 1 つ。オートマトン) | 章 | normal / half / full / special1 |
| buff | `battle.buffs[]` / `board.panels[].enemy.buffs[]` (`{key, value, turns}`) | バトル | powerDelta, blockDelta |

属性 (statuses 列):

| 列 | 値 | 意味 |
|---|---|---|
| polarity | bad / good / neutral | チップの色ファミリー、過酷さのカウント対象 (bad のみ) |
| side | player / enemy / both | 誰に付けられるか。敵に付くのは enemy / both だけ。「敵に付くのは毒だけ」という前提はコードに置かない |
| duration | stack / turn / permanent | 付与と減衰の規則 (下) |
| characterId | -1 / ヒロイン id | unique のみヒロイン id |
| sdLayer | 素材キー | common: 重ねる PNG (`status_<key>.png`)。unique: 衣装ごと差し替える PNG (`unique_<key>.png`)。costume: `costume_<key>.png` |
| effect | モジュール key | 省略時は key と同じ |
| values | intarray | モジュールのパラメータ (例: special1 の -4) |
| next | key | costume のみ: クロスブレイクで遷移する先 |
| order | int | チップと重ね順の表示順 |

## 付与の規則 (`ctx.applyStatus`)

1. `canApplyStatus(target, key)` が不許可なら何もしない (side が合わない、他ヒロインの固有バステ。イベント `statusSkipped` を出して設定ミスを見える化)
2. value に star の `badDuration+` を足す (polarity=bad のとき)
3. duration=stack: 既存エントリがあれば **加算**、無ければ追加
4. duration=turn: 既存があれば **上書き** (4 ターン眠り + 1 ターン眠り → 1)、無ければ追加
5. duration=permanent (良性ステート): 加算、減衰なし、章クリアで消える
6. kind=unique: `player.unique` を **上書き** (別の固有バステでも同じでも)。上書き前の固有バステの `onExpire` は呼ばない (置換であって消滅ではない)
7. `onApply` を呼ぶ (麻痺: ON の武器を強制 OFF、混乱: シャッフル + concealed + 次ターンの全装備 OFF 予約)
8. target が player で polarity=bad なら `counters.harshness.statusHits += 1`
9. 一発物 `statusApply` を outbox に流す

付与元は敵アクションとイベント効果 (`eventEffect.status`)。どちらも同じ規則を通る。

## 減衰と消滅

- common (stack / turn) と unique: `player.act.end` (03) で -1。0 で消滅し `onExpire` → イベント `statusExpire` / `uniqueExpire`
- poison だけ `player.tick` でダメージ → -1
- 眠り: 加えて敵の attack アクションがブロックを抜けて 1 以上のダメージになったとき即 0 (`player.damaged` で tag=enemyAttack かつ dmg ≥ 1。毒や自傷では解除しない。シールドが吸収しても解除する [仮])
- 章クリアで全部消える (`chapter.clear` の reset)。逃走では減らない
- 固有バステが消えたら `player.costume` のマスクが外れる (値は触っていないのでそのまま復活)
- 敵側のステート: `enemy.act.after` で -1、毒は `enemy.act.begin` で tick。バトルが終わっても消えない (逃走で盤面に戻っても保持)

## 共通ステート v1

| key | polarity | duration | 効果 (モジュールが登録するもの) |
|---|---|---|---|
| poison | bad | stack (side=both) | `player.tick` でスタック値ダメージ (ブロック・シールド貫通) → -1。回復で全消し。敵側は `enemy.act.begin` で同じ処理 (`enemy.statuses`) |
| sleep | bad | turn | permission `canAct` 不許可 (攻撃ボタンは zzz の記号表示)。フリーアクション (装備切替 / アイテム / アビリティ) も不可。`turn.command` で手番スキップ (攻撃せず敵が即行動)。敵の攻撃ダメージで解除 |
| paralyze | bad | stack | onApply で武器を全部 OFF。permission `canActivateEquipment` (武器) 不許可 |
| arousal | bad | stack | permission `canUseAbility` 不許可 (リチャージは進む) |
| sticky | bad | stack | 派生 `turnOrder` を enemy に (プレイヤー側の blitz 武器で打ち消せる) |
| confusion | bad | stack | onApply で `inventory.entities` の pos を rng でシャッフル (再付与でまたシャッフル) + `concealed = true` + `memo["status.confusion"].pendingDeactivate = true`。付与後最初の `turn.start` で 1 回だけ全装備を OFF (予約を消す)。消滅で `concealed = false` (位置はそのまま)。混乱中: 全部 ??? 表示 (ON/OFF 状態とタイルの幅は見える)、??? のまま使用・ON/OFF は可 (攻撃力やブロック値の変化がヒントになる)、獲得した物も ???、整理 (D&D) 不可、個体説明も出さない。隣接効果もシャッフル後の位置で効く |
| power | good | permanent | 派生 `attackPower` に +value |
| abilityDamage | good | permanent | アビリティ由来ダメージに +value |
| evade (かいひ) | good | permanent | 敵アクション `attack` の 1 発を無効化する (`enemy.attack.before` で 1 スタック消費して `negated`)。1 ターンに複数回攻撃されたら 2 発目以降は被弾。無効化された攻撃は防具摩耗・パリィ・眠り解除に関わらない。減衰しない (章のあいだ残る) |
| focus (こうちょう) | good | permanent | 次の 1 回の通常攻撃の攻撃力 +values[0] (2) × スタック。`player.strike.after` (50) で全部消費 |

新しい良性ステートは statuses に行を足し、モジュールを 1 つ書く。敵専用ステート (side=enemy) も同じ仕組みに乗る (例: 時止め = 敵の行動をスキップする permission、恒久攻撃力ダウン = duration permanent の enemyAttack 修正)。v1 のマスタには無いが、構造は最初から対応する。

## 固有バステ

- ヒロインごとに 2 種。key は `<characterKey>_unique1` / `_unique2` のようにヒロインが分かる名前にする
- 効果はヒロインごとにモジュール実装 (`effects/statuses/unique/<characterKey>/`)
- **衣装のマスク**: unique が付いている間、`player.costume` は表示 (SD の衣装レイヤー) も効果 (半壊 -1、全壊 +1 被ダメ、特殊衣装の効果) も無視される。SD は `unique_<key>.png` が衣装レイヤーを丸ごと置き換える。固有バステが切れたら元の衣装に戻る (costume の値は変えない)
- unique 中にクロスブレイクを受けても **何も起きない** (衣装は進まない、過酷さも数えない。イベント `crossBreakIgnored`)
- Lv1 と Lv2 の敵は同じステート key を付与するが、敵としては別の行 (見た目も行動も違ってよい)
- 付与する敵: `enemies.kind = characterUnique` の行 (characterId = ヒロイン、slot 1..4 = 固有1 Lv1 / 固有1 Lv2 / 固有2 Lv1 / 固有2 Lv2)。章の enemyIds に書くのは `enemies.kind = placeholder` の 4 行 (slot 1..4)。`chapter.build` の標準処理が挑戦中 character の同 slot に置き換える。該当が無ければマスタ不整合として実行時に例外 (フォールバックしない)
- 敵アクションの書き方: `actions[i].type` に固有バステの key、value にターン数
- デスサイズちゃん (11): `ds_crystal` 結晶化 = 許可 `canFlee` 不許可 (にげる ボタンにテクスチャ)。`ds_fever` 体温上昇 = onApply で衣装を full にする (過酷さは statusHits で数え済みなので crossBreaks は増やさない)、許可 `canRepairCostume` 不許可、切れても衣装は full のまま

## 衣装

- オートマトン: `normal → half → full → full` (クロスブレイク)、`special1 → normal`。遷移先は statuses.next 列。衣装が実際に変わったときだけ過酷さ (`crossBreaks`) を数える (full → full は数えない)
- 付随効果は costume 行のモジュールが登録する (half: attackPower -1 / full: attackPower -1 と enemyAttack +1 / special1: turn 1 の enemyAttack -4)。unique 中はマスク (03 の派生値計算が `player.unique` を見て costume の寄与を捨てる)
- `wearCostume` アイテムで任意に着替え、`repairCostume` (未移植) で half/full → normal。修復は許可 `canRepairCostume` を通す (体温上昇中は不可)。固有バステの onApply が衣装を変えるときは `setCostume(key, "unique")` (マスク中なので表示は固有バステの SD、切れたら変えた衣装が現れる)
- 章クリアで normal に戻る (特殊衣装も剥がれる)
- SD の重ね順: 羽 → 衣装レイヤー (unique なら `unique_<key>`、そうでなければ `costume_<costume>`) → 表情 → common の重ね (statuses.order 昇順)。毒中の表情固定 (げっそり) は毒モジュールの text ヒントで app が判断

## バフ (バトルスコープ)

- key は statuses(kind=buff)。v1: `powerDelta`, `blockDelta`。同 key は value 加算、turns は最新で上書き (xqueens の stackable と同じ)
- 減衰は「自分側の行動の後」に -1 (03)。turns=1 は次の自分の行動 1 回
- 敵のバフは敵状態に残る (逃走で盤面に戻っても保持。初期仕様 Q18)

## 過酷さのカウント

- `counters.harshness.statusHits`: `applyStatus` で player 側に polarity=bad が実際に付与された回数 (スキップは数えない)。重ね掛けも 1 回ずつ、固有バステも含む
- `counters.harshness.crossBreaks`: クロスブレイクで衣装状態が実際に変わった回数
- `counters.harshness.misfortunes`: `event.resolved` で misfortune のイベントを再生した回数
- `counters.harshness.bonus`: イベント効果 `harshness` の直接加算 (重みを掛けない)
- 判定は派生値 `harshnessScore` = misfortunes × W1 + (statusHits + crossBreaks) × W2 + bonus (W は config) と `books.harshnessThreshold`。インゲームに「本の要求」メーターとして常時表示

## 表示の規則

- チップ列 = `player.statuses` (order 順) + `player.unique` + (unique が無く costume ≠ normal なら衣装チップ)。値は stack / turn / permanent の意味で同じ数字を出す (プロト踏襲)。tips で意味を説明
- 混乱中はインベントリの全部を ??? にする (アイコン、名前、残回数、効果バッジ)。装備の ON/OFF とタイルの幅は見える。チップ列と立ち絵は隠さない
- 敵側のステートは盤面の敵パネルと戦闘パネルの敵側にチップで出す (プロトの毒チップの位置)
