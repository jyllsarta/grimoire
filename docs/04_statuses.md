# 04 ステート (状態異常・衣装・良性ステート・バフ)

すべて `statuses` マスタの行で、効果は `status` family のモジュールで表す。state 上の置き場と持続の規則は種類で決まる。

## 種類

| kind | state の置き場 | scope | 例 |
|---|---|---|---|
| common | `heroine.statuses[{key, value}]` (複合可) | 章 | 毒、眠り、麻痺、発情、ねばねば、混乱、良性ステート (power, abilityDamage) |
| unique | `heroine.unique {key, turns}` (最大 1 つ、上書き) | 章 | ヒロインごとの固有バステ 2 種 |
| costume | `heroine.costume` (key 1 つ。オートマトン) | 章 | normal / half / full / special1 |
| buff | `battle.buffs[]` / `board.panels[].enemy.buffs[]` (`{key, value, turns}`) | バトル | powerDelta, blockDelta |

属性 (statuses 列):

| 列 | 値 | 意味 |
|---|---|---|
| polarity | bad / good / neutral | チップの色ファミリー、過酷さのカウント対象 (bad のみ) |
| duration | stack / turn / permanent | 付与と減衰の規則 (下) |
| characterId | -1 / ヒロイン id | unique のみヒロイン id |
| sdLayer | 素材キー | common: 重ねる PNG (`status_<key>.png`)。unique: 衣装ごと差し替える PNG (`unique_<key>.png`)。costume: `costume_<key>.png` |
| effect | モジュール key | 省略時は key と同じ |
| values | intarray | モジュールのパラメータ (例: special1 の -4) |
| next | key | costume のみ: クロスブレイクで遷移する先 |
| order | int | チップと重ね順の表示順 |

## 付与の規則 (`ctx.applyStatus`)

1. `canApplyStatus(key)` が不許可なら何もしない (他ヒロインの固有バステは **スキップ**。イベント `statusSkipped` を出して設定ミスを見える化)
2. value に star の `badDuration+` を足す (polarity=bad のとき)
3. duration=stack: 既存エントリがあれば **加算**、無ければ追加
4. duration=turn: 既存があれば **上書き** (4 ターン眠り + 1 ターン眠り → 1)、無ければ追加
5. duration=permanent (良性ステート): 加算、減衰なし、章クリアで消える
6. kind=unique: `heroine.unique` を **上書き** (別の固有バステでも同じでも)。上書き前の固有バステの `onExpire` は呼ばない (R2 で確認)
7. `onApply` を呼ぶ (麻痺: ON の武器を強制 OFF、混乱: シャッフル + concealed)
8. polarity=bad なら `counters.harshness.statusHits += 1`
9. イベント `statusApply` (view 付き)

## 減衰と消滅

- common (stack / turn) と unique: `heroine.act.end` (03) で -1。0 で消滅し `onExpire` → イベント `statusExpire` / `uniqueExpire`
- poison だけ `heroine.tick` でダメージ → -1
- 眠り: 加えてライフが減る被ダメージで即 0 (`damageHeroine` の中。毒ダメージも含めるかは R2)
- 章クリアで全部消える (`chapter.clear` の reset)。逃走では減らない
- 固有バステが消えたら `heroine.costume` のマスクが外れる (値は触っていないのでそのまま復活)

## 共通ステート v1

| key | polarity | duration | 効果 (モジュールが登録するもの) |
|---|---|---|---|
| poison | bad | stack | `heroine.tick` でスタック値ダメージ (ブロック・シールド貫通) → -1。回復で全消し。敵にも同じ形 (`enemy.poison`) |
| sleep | bad | turn | permission `canAct` 不許可。`turn.command` で手番スキップ (攻撃せず敵が即行動)。被ダメで解除。フリーアクションの可否は R2 |
| paralyze | bad | stack | onApply で武器を全部 OFF。permission `canActivateEquipment` (武器) 不許可 |
| arousal | bad | stack | permission `canUseAbility` 不許可 (リチャージは進む) |
| sticky | bad | stack | 派生 `turnOrder` を enemy に (ヒロインの blitz 武器で打ち消せる) |
| confusion | bad | stack | onApply で `inventory.entities` の pos を rng でシャッフル + `concealed = true`。消滅で `concealed = false` (位置はそのまま)。詳細は R2 |
| power | good | permanent | 派生 `attackPower` に +value |
| abilityDamage | good | permanent | アビリティ由来ダメージに +value |

新しい良性ステートは statuses に行を足し、モジュールを 1 つ書く。

## 固有バステ

- ヒロインごとに 2 種。key は `<heroineKey>_unique1` / `_unique2` のようにヒロインが分かる名前にする
- 効果はヒロインごとにモジュール実装 (`effects/statuses/unique/<heroine>/`)
- **衣装のマスク**: unique が付いている間、`heroine.costume` は表示 (SD の衣装レイヤー) も効果 (半壊 -1、全壊 +1 被ダメ、特殊衣装の効果) も無視される。SD は `unique_<key>.png` が衣装レイヤーを丸ごと置き換える。固有バステが切れたら元の衣装に戻る (costume の値は変えない)
- unique 中にクロスブレイクを受けたときに裏で衣装状態を進めるかは R2
- 付与する敵: `enemies.kind = heroineUnique` の行 (characterId = ヒロイン、slot 1..4 = 固有1 Lv1 / 固有1 Lv2 / 固有2 Lv1 / 固有2 Lv2)。章の enemyIds に書くのは `enemies.kind = placeholder` の 4 行 (slot 1..4)。`chapter.build` の標準処理が挑戦中ヒロインの同 slot に置き換える。該当が無ければマスタ不整合としてエラー (フォールバックしない)
- 敵アクションの書き方: `actions[i].type` に固有バステの key、value にターン数

## 衣装

- オートマトン: `normal → half → full → full` (クロスブレイク)、`special1 → normal`。遷移先は statuses.next 列
- 付随効果は costume 行のモジュールが登録する (half: attackPower -1 / full: attackPower -1 と enemyAttack +1 / special1: turn 1 の enemyAttack -4)。unique 中はマスク (03 の派生値計算が `heroine.unique` を見て costume の寄与を捨てる)
- `wearCostume` アイテムで任意に着替え、`repairCostume` で half/full → normal
- 章クリアで normal に戻る (特殊衣装も剥がれる)
- SD の重ね順: 羽 → 衣装レイヤー (unique なら `unique_<key>`、そうでなければ `costume_<costume>`) → 表情 → common の重ね (statuses.order 昇順)。毒中の表情固定 (げっそり) は毒モジュールの text ヒントで app が判断

## バフ (バトルスコープ)

- key は statuses(kind=buff)。v1: `powerDelta`, `blockDelta`。同 key は value 加算、turns は最新で上書き (xqueens の stackable と同じ)
- 減衰は「自分側の行動の後」に -1 (03)。turns=1 は次の自分の行動 1 回
- 敵のバフは敵状態に残る (逃走で盤面に戻っても保持。バトル終了で消すかは R2)

## 過酷さのカウント

- `counters.harshness.statusHits`: `applyStatus` で polarity=bad が実際に付与された回数 (スキップは数えない)。重ね掛けも 1 回ずつ。クロスブレイクを数えるかは R2
- `counters.harshness.misfortunes`: `event.resolved` で misfortune のイベントを再生した回数
- 判定は派生値 `harshnessScore` と `books.harshnessThreshold`

## 表示の規則

- チップ列 = `heroine.statuses` (order 順) + `heroine.unique` + (unique が無く costume ≠ normal なら衣装チップ)。値は stack / turn / permanent の意味で同じ数字を出す (プロト踏襲)。tips で意味を説明
- 混乱中はインベントリの全部を ??? にする (アイコン、名前、残回数、効果バッジ)。チップ列と立ち絵は隠さない
