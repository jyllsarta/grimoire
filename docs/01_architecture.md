# 01 アーキテクチャ

## 技術スタック (R1 Q1/Q5 で決定)

electron-vite + Vue 3 + Pinia。xqueens / tricy と同じ構成で、エディション分割・Android (Capacitor)・Web 体験版・Steam 健全版の土台を流用する。
バージョンはスキャフォールド時点の最新に上げる (2026-09-22 時点の npm 最新)。組み合わせの相性 (electron-vite 5 と vite 8、vitest 5) はスキャフォールドで実測し、動かなければ 1 段下げる。

| パッケージ | xqueens v1.3.0 | 採用予定 |
|---|---|---|
| electron | 35 | 44 |
| electron-vite | 3 | 5 |
| vite | 6 | 8 |
| vue | 3.5 | 3.5 |
| pinia | 3 | 4 |
| vitest | 4 | 5 |
| gsap | 3.13 | 3.15 |
| @capacitor/* | 8.4 | 8.5 |
| electron-builder | 25 | 26 |
| eslint | 9 | 10 |
| sass-embedded / happy-dom / prettier | 1.89 / 20 / 3.5 | 最新 |

Node 22 / npm 10。Mac はデバッグ用途のみ (ビルド配布は Windows / Web / Android)。

## ディレクトリ

```
grimoire/
├ docs/                       設計書・Q&A (正本)
├ data/                       マスタ CSV (正本)、sheet_id.txt
├ config/
│   ├ editions.mjs            エディション名 → フラグ集合 (xqueens v1.3.0 方式)
│   └ edition-asset-blacklist.mjs
├ scripts/                    ビルド補助 (エディション別 public、マーカー、zip)
├ tools/                      import / push / sync.ps1 / sheets / shot / editor / gen_schema / placeholders / *.py
├ test/                       vitest (unit / scenario / fuzz / harness)
├ src/main/                   Electron main (ウィンドウ、セーブファイル IPC)
├ src/preload/
└ src/renderer/
    ├ index.html
    ├ public/assets/          素材 (モノレポ同居)
    ├ public/grimoire_scenes  → 秘匿素材リポへの symlink (R1 Q4)
    └ src/
        ├ main.js, App.vue
        ├ core/               純 JS ゲームロジック。Vue/DOM/Electron を import しない。node でそのまま動く
        │   ├ state/          schema.js (初期状態・検証・不変条件), phase.js (フェーズ導出)
        │   ├ rng.js, uid.js
        │   ├ master/         tables.js (列定義。tools も同じ定義を読む), index.js (アクセサ), validate.js
        │   ├ steps/          1 ステップ 1 ファイル (run/ chapter/ action/ damage/ battle/)。各ファイルが標準処理 (order 付き) と「次のステップ」を持つ。index.js は 03 の表の並びで登録するだけ、bus.js がフック解決
        │   ├ derived/        1 派生値 1 ファイル (max_hp.js attack_power.js turn_order.js ...)。index.js は一覧と stage の計算規則
        │   ├ permissions/    1 許可 1 ファイル (can_act.js ...)。lists/ も同じ (start_entities.js chapter_panel_specs.js shop_candidates.js)
        │   ├ verbs/          ctx の動詞 (damage.js heal.js status.js inventory.js costume.js memo.js)。ctx.js は束ねるだけ
        │   ├ effects/        index.js (明示順レジストリ) + family ごとのディレクトリ (statuses/ costumes/ bookRules/ passives/ relics/ star/ items/ abilities/ enemyActions/ eventEffects/)。各 family の sources.js が「いま state 上にいる自分たち」を列挙し、effects/sources.js が連結する
        │   ├ commands/       ドメインごとのファイル (chapter.js battle.js inventory.js intermission.js debug.js) + index.js (dispatch とフェーズ判定)。advance.js がステップマシンを 1 つ進める
        │   ├ domain/         board.js inventory.js battle.js chapter.js shop.js entity.js placeholder.js (状態を動かす関数。ステップとコマンドが呼ぶ)
        │   ├ queries/        UI が読む問い合わせ (内訳、許可、山札の公開情報、処理順、リチャージ条件 ...)
        │   ├ outbox.js       一発物 (演出・音) の通知。購読方式
        │   └ run.js          newRun / serialize / deserialize / migrate
        ├ masterdata/         生成物。data/*.csv から tools/import.js が profile 別に生成し、コミットする
        ├ app/                Vue 層: scenes/ dialogs/ components/ fragments/ stores/ sound/ inspector/ styles/ (tokens と本ごとの skins/)。StepMover と待ち時間の表もここ
        └ platform/           保存先アダプタ (Electron ファイル / localStorage)、エディションフラグ、ウィンドウ
```

依存の向き: `app → core`、`core → masterdata`、`platform ← app`。core が app や platform を参照したら lint で落とす。

core の中のファイル分割の方針 (xqueens の `phase_*.js` と同じ): **興味の単位 = ファイル**。ステップ・派生値・許可・動詞・効果はそれぞれ 1 つ 1 ファイルにし、順番や一覧が要るところ (steps/index.js、effects/index.js、derived/index.js) は登録だけを書いて実装を置かない。03 の「処理順が 1 か所で見える」は、この一覧と `queries/resolvedOrder` (インスペクタの処理順ビューア) で満たす。

## レイヤーの役割

| 層 | 役割 | 持ってよい状態 |
|---|---|---|
| core | ルール。コマンドで state を変え、一発物を outbox に流す。乱数は state の rng だけを使う。秒数を知らない | GameState (02) のみ。モジュール変数に状態を持たない |
| app (Vue) | 描画、演出、音、入力、**ステップの進行 (StepMover)**。state を読んで描き、core のコマンドを dispatch する | シーン、ダイアログ、選択中の対象、演出中フラグ、オプション、待ち時間の表 |
| platform | 保存先、ウィンドウ、エディションフラグ、Capacitor | なし (I/O のみ) |
| masterdata | 生成された定数 | なし |

## データの流れ (xqueens 方式)

```
[入力] → app: run store の dispatch(command, args)
      → core: commands/index が phaseOf(state) と battle.step で許可判定 → コマンド関数が state を直接書き換え、一発物を outbox に流す
      → app: state は Vue の reactive なので、変わった場所だけ再描画される。outbox の一発物 (数字ポップ、トースト、SE、カットイン) を Fragments / Sound に振り分ける
      → app: オートセーブ (JSON.stringify)
バトル中:
      攻撃ボタン → dispatch("attack")  (battle.step が select → turn.command になるだけ)
      StepMover が battle.step を watch し、「そのステップで出た一発物の演出時間」だけ待ってから dispatch("advance") を打つ。select か battle.end に着くまで繰り返す
      勝利で battle.end に着いたときは、勝利演出を見せる時間 (delays.js の VICTORY_CLOSE_MS) だけ待って dispatch("closeBattle") も StepMover が打つ。逃走 / 敗北は とじる ボタン待ち
```

- **state は 1 本の実物**。app の run store が `reactive(state)` で包んで晒し、全コンポーネントが直接読む (プロトの battleVm のような写しは作らない)。core は包まれているかどうかを気にしない。テストは素の state で同じコードを回す (xqueens と同じ)
- **書くのは dispatch だけ**。Vue から state に代入しないことを lint (`no-state-write`) で守る。xqueens で Vue 側の state 書き込みが 0 件だったのと同じ規律
- **演出の表示順はゲームロジック**。バトルのターンは state 上のステップマシン (`battle.step`) で、`advance` が 1 ステップだけ進める。どの順に何が起きるかは 03 のステップ表が決め、app は間を空けるだけ。xqueens の PhaseMover / `continue()` と同じ構造
- **待ち時間は app が持つ** (xqueens ではフェーズモジュールの `defaultDelay()` にあった。tricy の反省 (4) に従って app の表に移す)。表はイベント種別 → ms で、1 ステップの待ち = そのステップで出た一発物の待ちの合計。高速化トグルは倍率
- **一発物は outbox** (tricy の改良)。xqueens は state 内のキュー (`soundManager.unplayedSounds` 等) を View が watch して flush していたが、grimoire はオートセーブに transient を混ぜたくないので購読方式にする。テストは購読で全部捕捉できる
- 途中セーブはコマンドごと (advance 含む)。ターンの途中で落ちても `battle.step` が残っているので、再開すると StepMover が続きを演出つきで進める
- 章クリア・パネル回収・幕間のコマンドは 1 回で完結する (ステップに分けない)。盤面の落下・補充は outbox のイベント (`panelFall` 等) と uid キーの TransitionGroup で動かす

### Proxy の扱い (core の 3 規則)

xqueens ではエンジンが Vue を import せず、実行時だけ Proxy 越しに動き、`toRaw` / `markRaw` を一度も使わずに済んでいる。grimoire も同じにする。core に置く規則は 3 つだけ。

1. オブジェクト同士を `===` で比べない (uid か key で比べる)
2. オブジェクトを Map / Set のキーにしない
3. 複製・保存は `JSON.parse(JSON.stringify())` (`structuredClone` は Proxy で例外になる)

`state.uiState` に当たるもの (選択中の対象、開いているダイアログ、演出中フラグ) は GameState に入れず、Pinia の run ストアに置く (セーブに混ざらないように)。

## 画面サイズ (R1 Q3 の提案、R2 Q37 で確定。仕上がりは目視レビュー)

transform: scale のステージフィットは実効解像度が落ちるので採らない。代わりに **論理ステージ + CSS `zoom`** にする。

- 論理単位は px。基準は 1280x720。デザインは今までどおり px で書く
- 起動時とリサイズ時に `k = min(innerWidth / 1280, innerHeight / 720)` を求め、ステージ要素に `zoom: k` をかける
- ステージの論理サイズは `(innerWidth / k, innerHeight / k)`。常に 1280x720 **以上** で、余った方向だけ伸びる。中央の 1280x720 を「セーフエリア」と呼び、必ず見えるべき UI はここに置く。伸びた分は背景と、左右端にアンカーされた要素 (右の立ち絵、左カラム) がスライドして埋める
- CSS zoom は transform と違い、レイアウト計算そのものを拡大する。文字はデバイス解像度で描かれ、`getBoundingClientRect` とクリック座標は一致する (Chrome 153 の headless で確認済み: 論理 (100,50) の要素が k=1.368 で画面 (137,68) にあり、`elementFromPoint` も一致。`offsetLeft` と `font-size` は論理値のまま)
- 文字はウィンドウと一緒に大きくなるので「大きい窓で文字が相対的に小さい」問題は起きない。xqueens の zoomFactor (Electron 限定) は使わず、Web / Android も同じコードで動く
- Electron のウィンドウ最小サイズは 1280x720 (content size)。Web でそれより小さければ k < 1 で縮む (縮小は避けられない)
- DPR が 1 でない環境では zoom と DPR が合成される。立ち絵と SD は 2 倍以上の解像度で用意する (xqueens の 1600x2400 で足りる)
- ドット絵アイコン (24px 系) は非整数倍で滲む。grimoire の新規アイコン (バステ、図形、ノード) は SVG で描き、既存 gif を使う場所は `--pixel-scale` (k×DPR を整数に丸めた倍率) でサイズを決めて `image-rendering: pixelated` にする。位置の端数ずれは許容。SVG は仮で、いつか描き直す
- ユーザ設定「UI の大きさ」(0.8〜1.2 倍) を後から足せるよう、k の計算を 1 箇所 (`platform/viewport.js`) に閉じる

代案として rem ベース (`html { font-size: calc(...) }` + 全寸法を rem) も成立するが、px のまま書ける zoom を採る。zoom が特定 WebView で崩れたら rem に切り替えられるよう、寸法は CSS 変数経由で書く。

## UI 構成 (Vue)

- `scenes/`: Title / Opening / Menu / CharacterDetail (ダイアログでもよい) / BookSelect / InGame / Intermission / Result / StarPalette / StarEditor(dev)
- `dialogs/`: Skit / Tips / Options / Savedata / Credits / Language / Confirm / Organize / PanelPeek / Detail (個体の詳細。ルール説明の Tips と対。Desc のような略名は使わない)
- `components/`: Board, PanelCard, InventoryBar, EntityTile, LifePanel, StatusChips, BattlePanel, EnemyFigure, CharacterFigure (立ち絵。オラクルちゃんも同じ部品), SdPiece (駒), Baloon, Shape (図形 SVG), Ornament (飾り。OrnamentHead / OrnamentRule / OrnamentFoot), Shop, DeckSummary ...
- `fragments/`: xqueens の FragmentManager 方式。outbox の一発物を app 側の演出テーブルが Fragment (トースト、数字ポップ、カットイン) に変換する
- `StepMover`: `battle.step` を watch し、待ち時間の表 (`app/battle/delays.js`: イベント種別 → ms、高速化倍率) に従って `advance` を打つ。xqueens の PhaseMover 相当。世代カウンタ (epoch) で古いタイマーを捨てるのも同じ
- `stores/`: `session` (scene, dialogs, options, language, 音量)、`run` (state を reactive で保持、dispatch、選択中の対象、演出中フラグ)、`inspector` (dev)
- `sound/`: tricy の Vue 非依存 SoundManager (WebAudio、sound_master がファイル一覧)
- スタイル: xqueens 準拠のトークン (色・フォントサイズ・角丸) を `styles/tokens.scss` に置き、tale の tonmana ルール (図形の色ファミリー、パネル形状、落ち影) を移植する。コンポーネントは scoped。いつか整える
- **インゲームは本ごとに別のスキン** (本の表紙のテイストを中にも反映する)。スキン = トークンの上書き (CSS 変数の束) + 差し替え素材で、`books.skin` が選ぶ。コンポーネントはトークン以外の色・形を直書きしない。どこを可変にするか、表紙のデザインは 2 キャラ目の実装時に詰める

## エディション

xqueens v1.3.0 の方式をそのまま移植する。

- `config/editions.mjs`: `EDITION=<名前>` 1 本。プリセットは `prod / trial / web_trial / static_web_trial / cien / cien_web / android / steam / steam_clean` (steam_gl はアセット差分のみなので必要になったら)
- フラグ: `TRIAL / CIEN / CLEAN / WEB / STATIC_WEB / ANDROID / STEAM` + `PROD` (NODE_ENV 由来、エディションではない)。renderer では `__IS_X__` 定数、テンプレートでは `data-if-x / data-else-x` で要素ごと落とす
- マスタ: `_isTrial / _isCien / _isClean` 列 (1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ) で profile 別に生成。`@masterdata` alias が profile ディレクトリを指す
- アセット: `edition-asset-blacklist.mjs` で public から除外。健全版は秘匿シーンをまるごと落とす
- セーブキー: エディション群ごと (`prod` / `cien` / `trial` / `steam` 系は共有)。06_save
- 健全版は minify でコメントも落とす (xqueens の知見)

## i18n

機能だけ入れて日本語のみ埋める (R1 Q30)。マスタの文字列列は `name-en_us` のようなロケール接尾辞で追加でき、`Masterdata.switchLanguage` が列を差し替える。systemTexts は `key → text`。フォント切替は xqueens の App.vue 方式。翻訳パイプライン (catalog / batches) は xqueens_masterdata のものを後から流用できる形にしておく。

## 開発ビルド限定

- **state インスペクタ** (08_verification): 右側に state ツリー、変更フィールドの発光、直前のコマンドと一発物、派生値の内訳、処理順ビューア、マスタ警告
- URL ハッシュ直行 (`#ingame` `#battle` `#intermission` ...): dev 専用のシナリオルータが、固定シードでコマンドを打って状態を作る
- デバッグ関数 (通貨増加、全回復、任意章開始、戦闘即勝利、ステート付与、乱数リシード)。全部コマンド経由
- `__IS_PROD__` で全部落ちる

## Electron main と他プラットフォーム

- main: ウィンドウ (1280x720、最小 1280x720、F11 全画面、状態記憶)、セーブファイル IPC (06_save)、外部リンクはブラウザへ
- Web: `base: "./"`、保存は localStorage。Android: Capacitor、戻るボタンでダイアログを閉じる、軽量モード既定 ON (xqueens 準拠)
