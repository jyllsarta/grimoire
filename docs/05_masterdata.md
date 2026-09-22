# 05 マスタデータ

## パイプライン

- 正本は `data/*.csv` (1 テーブル = 1 ファイル = シートの 1 タブ)。Google スプレッドシートとは tale の Sheets API 方式で往復する (`tools/sync.ps1`: 取得 / `-Push`: 書き込み / `-Watch`)。認証は自前 OAuth クライアント (tale の README の手順をそのまま移植)
- `node tools/import.js` が CSV → `src/renderer/src/masterdata/<profile>/*.js` を **全 profile ぶん** 生成し、selftest を回す。生成物もコミットする (ビルドにネットワークが要らない)
- profile = エディションフラグの組み合わせ (`base` / `trial` / `cien` / `cien_trial` / `clean` ...)。`@masterdata` alias が選ぶ
- xqueens の Elixir runner は使わない (R1 Q32)

## 記法 (tale から継続)

- ヘッダー `カラム名:型`。型: `string` / `integer` (空 = null) / `intarray` (`[1,2]`) / `array` (JSON) / `boolean` (空, FALSE = 偽)
- 列展開: `actions[0].type:string` … → `actions: [{type, value}]`。`passive.type` のような `.` だけはオブジェクト 1 個。二重ネスト禁止 → テーブル分割 + id 参照
- メタ列: `_skip:boolean` (真の行は出力しない)。**エディション列** `_isTrial` / `_isCien` / `_isClean` (`integer`: 空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ出力)。xqueens と同じ規約
- ロケール列: `name-en_us:string` のように `列名-ロケール`。日本語列 (接尾辞なし) だけ埋める (R1 Q30)。健全版は翻訳列を落とす (xqueens 踏襲、必要になったら)
- 列定義の実体は `src/renderer/src/core/master/tables.js` 1 箇所。tools/import.js と core の検証が同じ定義を読む

## 原則

- **ID の値で分岐しない**。ID 空間の分割 (装備 1001+ など) は人間の認知用
- **マスタ不整合はエラーで落ちてよい。フォールバック・互換吸収を書かない** (xqueens AGENTS.md)
- 語彙 (statuses, bookRules, buffs, スクリプトのキー) は文字列 key、カタログは数値 id (02 の原則 3)
- テストデータ: 「先頭が 9 で既存と桁が違う ID」は自由に追加・変更してよい (tale の約束を継続)
- 効果の `type` 列の値域は **効果モジュールのレジストリが正**。`tools/gen_schema.js` が `data/SCHEMA.md` を生成する (手書きしない)

## テーブル v1

`[R2]` は回答待ちの列。名前はプロトから book / chapter に改める。

### config (1 行)

`title, startSlots, maxSlots, shopSlots (6), rerollPrice (2)`

### characters

ヒロインとオラクルちゃん。

`id, role (heroine|oracle), key (string。ステートのキーやスクリプトの参照名に使う), name, asKnownAs, description, hp, power, coins, imageId, bgmId, order, initialEquipmentIds, initialItemIds, initialAbilityIds, startEquipmentIds, startItemIds, startAbilityIds`

- initial* は「キャラ固有パネル」(毎章、山札に入る設計図)、start* は「章開始時にインベントリにある」(プロト踏襲)
- 当面 heroine は id 1 (デスサイズちゃん) のみ。oracle は id 0 案

### books

`id, characterId (この本の持ち主 = 呪われたヒロイン), name, description, order, chapterIds, extraChapterId, harshnessThreshold [R2], bgmId, coverImage`

### bookRules

本ごとのインゲーム共通効果。1 本に複数可。

`id, bookId, key (モジュール key), values, name, description, icon`

### chapters

`id, name, description, width, healPrice, clearJewelBonus, clearCrownBonus, enemyIds, bossEnemyId, equipmentIds, itemIds, abilityIds, eventIds, battleBg, bgmId`

- Extra Chapter も chapters の行 (books.extraChapterId)。ボスだけの章なら enemyIds を空にする [R2]
- enemyIds / eventIds には placeholder (下) を書ける

### enemies

`id, kind (normal|placeholder|heroineUnique), slot (placeholder / heroineUnique: 1..4), characterId (heroineUnique のみ), name, description, icon, reward, hp`

- placeholder 行は 4 つ (slot 1..4)。章の enemyIds に書くとヒロインの同 slot の heroineUnique に置き換わる
- ID の予約案: placeholder = 1..4、ヒロインの固有敵は `ヒロインid × 100 + slot` [R2]

### enemyActions

`_skip, id, enemyId, order, name, actions[i].type, actions[i].value`

- 敵 1 体につき 4 行 (order 1..4、id = 敵 id × 10 + order)、使わない行は `_skip` (tale の約束)
- `actions[i].type` ∈ enemyAction モジュール key (`attack, block, sleep, selfHarm, pierce, blitz, crossBreak`) ∪ statuses.key (kind=common|unique: value = スタック / ターン)

### equipments

`id, characterId, name, description, icon, category (weapon|armor), durability, power, block, cost, price, size, passive.type, passive.values (intarray) [プロトの value を values に], locked`

### items

`id, characterId, name, description, icon, durability, type, values, cost, price, size, locked, usableOutOfBattle [R2]`

### abilities

`id, characterId, name, description, icon, type, values, cost, price, size, durability, rechargeType, rechargeValue, locked`

### relics

`id, characterId (-1 = 共通), name, description, icon, rarity, price, crownPrice, type, values, locked`

### statuses

`id, key, kind (common|unique|costume|buff), polarity (bad|good|neutral), duration (stack|turn|permanent), characterId, name, description, icon, sdLayer, effect, values, next, order`

詳細は 04。

### events / eventChoices

`events: id, kind (normal|misfortune|placeholder), slot (placeholder / ヒロイン固有: 1..2) [R2], characterId, name, description, icon, cutin (シーン素材キー), choiceIds`
`eventChoices: id, label, resultText, effects[i].type, effects[i].value`

- 不利イベントの置き方 (章の eventIds に書く / 購入パネル / ヒロイン固有の placeholder) は R2

### starNodes / starPresets

`starNodes`: プロト踏襲 (`id, characterId, kind (origin|node|gate), x, y, fromIds, effectType, values, delta, gateType, gateValue, name, description`)。name / description は本番では手書き
`starPresets`: `id, characterId, difficulty (easy|normal|hard), nodeIds, name, description` — 難易度ボタンで有効化するノード集合 (R1 Q28)

### skits / skitLines / characterScripts

- `skits`: `id, characterId, key, type (talk|scene), trigger (opening|bookStart|bossBefore|bookClear|extraStart|happyEnd|normalEnd|lose ...), name, releaseByLose, order` [R2]
- `skitLines`: `id, skitId, order, speaker (h|p|o|自由), faceId, text, imageId (scene 用), soundId`
- `characterScripts`: `id, characterId, key, faceId, message, order` (tale と同じ。キーごとにランダム)

### systemTexts / tips / credits

- `systemTexts`: `id, key, text`。UI 固定文言。`T("key")` の静的走査 + 動的キーの申告で網羅チェック
- `tips`: `key, title, body`
- `credits`: 後で (xqueens 準拠)

## 検証 (selftest がやること)

- id 重複、参照切れ (全 *Ids)、type ∈ レジストリ、values の個数・値域・refs、statuses の kind/duration/next、placeholder の解決可能性 (全ヒロイン × 全 slot)、開始インベントリがマスに入るか、starNodes のグラフ整合、systemTexts の網羅、chapters の bossEnemyId が placeholder でないこと (ボスは固定)
- これに通らないマスタでゲームを起動しない
