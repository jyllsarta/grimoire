# 08 検証

core が Vue/DOM を持たないので、ほとんどの検証は node で回る。tale の 3 点セット (エンジン node 検証 / 実クリック autotest / ハッシュ + スクショ) を継続し、xqueens の 2 層テストを足す。

## テスト層 (vitest)

| 層 | 場所 | 内容 | いつ回す |
|---|---|---|---|
| unit | `test/unit/` | 効果モジュール 1 つ = 1 ファイル。派生値の内訳、許可、付与規則、順序 (`order.test.js`)、rng の再現性、serialize 往復 | 常時 (`npm test`、数秒) |
| scenario | `test/scenario/` | 固定シードでコマンド列を打ち、state と events を検証する DSL。「毒3 眠り1 …」のような複合状態を作って 1 ターン回す | 常時 |
| fuzz | `test/fuzz/*.fuzz.test.js` | 自動プレイヤーで数百ラン。ボットは `select` で手を選び、それ以外のステップは `advance` を回す。warn/error ゼロ、不変条件 (02) を advance ごとに検査、進行不能なし (select にも battle.end にも着かないバトルを検出) | 共有コア変更時とコミット前 (`npm run test:fuzz`) |
| master | `npm run selftest` | レジストリ駆動のマスタ検証 + ボット N ラン (勝率は参考値) | import.js 後に自動 |

ハーネス (`test/harness/`): `runGame({characterId, bookId, seed, playProb, bot})`、`runUntil(state, step)` (advance を回す)、`invariants.js` (毎コマンド検査)、`autoPlay.js` (queries だけを見て手を選ぶボット。UI と同じ情報しか使わない)、`explain.js` (失敗時に直前の state と outbox の一発物をダンプ)。outbox は購読で全部捕捉する。

## シナリオ DSL (案)

```js
scenario("麻痺 2 は次の 2 回の攻撃で武器が使えない", (s) => {
  s.start({ characterId: 1, bookId: 1, seed: 7 }).fixture("battle", { enemy: 901 });
  s.enemyRoutine("paralyze 2");              // テスト用の敵の行動を差し込む
  s.attack();                                // 敵フェーズで麻痺 2
  expect(s.q.canActivateEquipment(s.weapon(0))).toEqual({ ok: false, reason: "paralyze" });
  s.attack(); s.attack();
  expect(s.state.player.statuses).not.toContainEqual(expect.objectContaining({ key: "paralyze" }));
});
```

テスト用のマスタ (9 系 ID) は data に置き、本番マスタと一緒に検証する。

## state インスペクタ (dev 限定、R1 Q18 で採用)

画面右に折りたたみ式のパネル。

- **state ツリー**: state を JSON ツリーで表示。直前のコマンド (advance 含む) で変わったパスを 2 秒光らせる (dispatch の前後で `JSON.parse(JSON.stringify())` した写しを deep diff。写しはインスペクタの中だけ)
- **コマンドと一発物**: 直前のコマンド名・引数・返り値、そのコマンドで outbox に流れた一発物のリスト (type と payload)、いまの `battle.step`
- **派生値の内訳**: attackPower / blockValue / maxHp / slotCount / turnOrder / 許可 (canAct, canActivateEquipment ...) を選んで内訳表示
- **処理順ビューア**: ステップを選ぶと、いまの装備・レリック・ステート・本のルールで並ぶハンドラを order 順に表示
- **操作**: state を JSON でコピー / 貼り付けて差し替え、乱数のリシード、デバッグ関数 (通貨、全回復、ステート付与、章スキップ、即勝利)
- **不変条件**: 違反があれば赤く出す
- **マスタ警告**: import / selftest が見つけたマスタの問題を一覧 (起動は止めない)
- 実装は `app/inspector/` に閉じ、`__IS_PROD__` で丸ごと落とす

レビューの道具として使う: 画面の要素 → state のパスを言い当てられるかを、インスペクタで確認する。

## スクリーンショット・自動操作

- `tools/shot.js`: vite の dev サーバ (または preview) に対して headless Chrome で `#ingame` 等を撮る。出力先は `tmp/shots` (gitignore)。倍率指定、サイズ指定は tale と同じ
- `#autotest`: 実クリックで 1 ラン走破 (dev 限定)。`AUTOTEST_RESULT` を DOM に書き、shot.js が回収する
- 見た目の承認は tale と同じく `tmp/` の画像を人が見てから

## 静的検査

- eslint (core が app / platform / vue を import したら落とすルール、`Math.random` 禁止ルール)、prettier
- systemTexts の網羅: `T("...")` の静的走査 + 動的キーはモジュールの `text` 申告から集める (三項演算子でキーを組まない)
- `tools/gen_schema.js` の出力とコミット済み SCHEMA.md の差分チェック
