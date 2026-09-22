# 設計書 v1 のレビュー (2026-09-22) と反映

ユーザの指摘 → 反映先。

| 指摘 | 反映 |
|---|---|
| ヒロインは character マスタで。オラクルちゃんも character で表示ロジックも共通。oracle の個別命名は不要。「一部の character が本を持つ」リレーション | 05: characters から role を外し、ヒロイン = 本を持つ character (books.characterId)。state の `heroineId` → `characterId`。enemies.kind `heroineUnique` → `characterUnique`。UI は CharacterDetail / CharacterFigure。state のノード名は側の名前 `player` に (下の命名の行) |
| 山札は deck | `board.pool` → `board.deck`。ショップの候補は `shopCandidates` |
| ゲーム内での character と heroine の命名上の使い分けを明確に | 00 に「命名規則」を新設: character = 同一性 (マスタ・素材・セーブ・`characterId`)、heroine = 本を持つ character の分類語とプレイヤー向けの言葉、player / enemy = ラン・バトルの側、protagonist = おにーさん。state のノード `heroine` → `player`、ステップ `heroine.*` → `player.*`、動詞 `damagePlayer`、`statuses.side = player|enemy|both` |
| リアクティブにしない場合の同期漏れが心配。tricy の反省点の具体を知りたい | (v1.1) イベントに state 全体のスナップショットを持たせる案を書いたが、下の再指摘で撤回 |
| 同期漏れ (再): 演出の表示順もゲームロジック。エンジンは「次へ」の信号で 1 つ進めるだけ。xqueens ではエンジンが reactive を知らないし Vue は uiState 以外に触らない。読むだけなら state を直接晒してよいのでは。事実確認を | xqueens を実機で確認 (Vue から state への書き込み 0 件、js/ に Vue の import 0 件、toRaw/markRaw 0 件、PhaseMover が `continue()` で 1 ステップずつ進める、待ち時間はフェーズモジュールの `defaultDelay()` にある)。私の「xqueens 方式を採らない理由」は tricy の話の混同で誤り。**v1.2 で xqueens 方式に変更**: 実物の state を `reactive` で晒す、バトルは `battle.step` のステップマシンを `advance` で 1 つずつ進める、待ち時間は app の表、一発物は outbox (tricy の改良)、途中セーブはステップの途中でも再開可。core の Proxy 規則 3 つ (01) |
| 演出の待ち時間は app が持つ | 変更なし |
| SVG は仮、いつか書き直す | 01 / 09 に明記 |
| Desc は命名が悪い。Orn も同様 | Detail (個体の詳細) / Ornament (OrnamentHead など) に改名 (01, 07) |
| スタイルは一旦 OK、いつか整える。インゲームは本ごとに別スキン (表紙のテイストを中に反映)。2 キャラ目で作り込む | 01 に「本ごとのスキン = トークン上書き + 差し替え素材、`books.skin`」を追加。05 books に skin 列 |
| uid は 10001 から | 02 |
| 「敵に付くのは毒だけ」の簡略化は NG。時止め、恒久攻撃力マイナスなど敵専用ステートが増える | 02: `enemy.poison` → `enemy.statuses[{key, value}]`。04: statuses に `side (player/enemy/both)` を追加、敵側の tick / 減衰の位置を 03 に追加 |
| abilityDamageTaken はダメージごとに発生源 ID を記憶 | 02: `enemy.damageTaken[{tag, source, amount, turn}]` のログに変更。03: `damageEnemy` が 1 発ずつ積み、集計は query |
| タイムライン・エフェクト全て OK | — |
| 不正マスタでも console 警告を出しつつ起動 (入力途中の部分確認のため) | 05 検証、08 インスペクタ (マスタ警告バッジ)。実行時に壊れた行へ触れたら例外 (フォールバックなし) は維持 |
| セーブ / アウトゲーム / 検証 / アセット OK | — |
