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
        │   ├ timeline/       steps.js (ステップ一覧), standard.js (標準処理と order), bus.js (フック解決), derive.js (派生値)
        │   ├ effects/        index.js (明示順レジストリ) + statuses/ costumes/ bookRules/ passives/ relics/ star/ items/ abilities/ enemyActions/ eventEffects/
        │   ├ commands/       1 コマンド 1 ファイル + index.js (dispatch とフェーズ判定)
        │   ├ domain/         board.js inventory.js battle.js chapter.js shop.js star.js heroine.js wallet.js (状態を動かす動詞)
        │   ├ queries/        UI が読む問い合わせ (内訳、許可、山札の公開情報、リチャージ条件 ...)
        │   ├ events.js       イベント生成と BattleView スナップショット
        │   └ run.js          newRun / serialize / deserialize / migrate
        ├ masterdata/         生成物。data/*.csv から tools/import.js が profile 別に生成し、コミットする
        ├ app/                Vue 層: scenes/ dialogs/ components/ fragments/ stores/ sound/ inspector/ styles/
        └ platform/           保存先アダプタ (Electron ファイル / localStorage)、エディションフラグ、ウィンドウ
```

依存の向き: `app → core`、`core → masterdata`、`platform ← app`。core が app や platform を参照したら lint で落とす。

## レイヤーの役割

| 層 | 役割 | 持ってよい状態 |
|---|---|---|
| core | ルール。コマンドで state を変え、イベント列を返す。乱数は state の rng だけを使う | GameState (02) のみ。モジュール変数に状態を持たない |
| app (Vue) | 描画、演出、音、入力。core のコマンドを dispatch し、返ってきたイベントを順に演出する | シーン、ダイアログ、演出中フラグ、表示中スナップショット、オプション |
| platform | 保存先、ウィンドウ、エディションフラグ、Capacitor | なし (I/O のみ) |
| masterdata | 生成された定数 | なし |

## データの流れ

```
[入力] → app: run store の dispatch(command, args)
      → core: commands/index が phaseOf(state) で許可判定 → コマンド関数が state を直接書き換え、events を返す
      → app: current = structuredClone(state) を保存 (オートセーブもこれ)
      → app: events を順に演出。戦闘中は event.view (BattleView) を表示に使い、演出が終わったら displayed = current
```

- core の state は Vue のリアクティブにしない (tricy の反省)。UI は「コマンド 1 回 = スナップショット 1 個」の粒度で再描画する。state は小さい (数十 KB) ので clone は無視できる
- イベントは transient。state には残さない。セーブされるのは常にコマンド完了後の整合した state だけなので、演出の途中で落ちても再開は「コマンド後の状態」から始まる (演出は再生されない)
- 盤面の落下や補充の演出は、イベントの payload (`panelFall` 等) と、displayed と current の盤面差分から組み立てる
- 演出の待ち時間は app が持つ。core は秒数を知らない (tricy の反省)

## 画面サイズ (R1 Q3 の提案)

transform: scale のステージフィットは実効解像度が落ちるので採らない。代わりに **論理ステージ + CSS `zoom`** にする。

- 論理単位は px。基準は 1280x720。デザインは今までどおり px で書く
- 起動時とリサイズ時に `k = min(innerWidth / 1280, innerHeight / 720)` を求め、ステージ要素に `zoom: k` をかける
- ステージの論理サイズは `(innerWidth / k, innerHeight / k)`。常に 1280x720 **以上** で、余った方向だけ伸びる。中央の 1280x720 を「セーフエリア」と呼び、必ず見えるべき UI はここに置く。伸びた分は背景と、左右端にアンカーされた要素 (右の立ち絵、左カラム) がスライドして埋める
- CSS zoom は transform と違い、レイアウト計算そのものを拡大する。文字はデバイス解像度で描かれ、`getBoundingClientRect` とクリック座標は一致する (Chrome 153 の headless で確認済み: 論理 (100,50) の要素が k=1.368 で画面 (137,68) にあり、`elementFromPoint` も一致。`offsetLeft` と `font-size` は論理値のまま)
- 文字はウィンドウと一緒に大きくなるので「大きい窓で文字が相対的に小さい」問題は起きない。xqueens の zoomFactor (Electron 限定) は使わず、Web / Android も同じコードで動く
- Electron のウィンドウ最小サイズは 1280x720 (content size)。Web でそれより小さければ k < 1 で縮む (縮小は避けられない)
- DPR が 1 でない環境では zoom と DPR が合成される。立ち絵と SD は 2 倍以上の解像度で用意する (xqueens の 1600x2400 で足りる)
- ドット絵アイコン (24px 系) は非整数倍で滲む。grimoire の新規アイコン (バステ、図形、ノード) は SVG で描き、既存 gif を使う場所は `--pixel-scale` (k×DPR を整数に丸めた倍率) でサイズを決めて `image-rendering: pixelated` にする。位置の端数ずれは許容
- ユーザ設定「UI の大きさ」(0.8〜1.2 倍) を後から足せるよう、k の計算を 1 箇所 (`platform/viewport.js`) に閉じる

代案として rem ベース (`html { font-size: calc(...) }` + 全寸法を rem) も成立するが、px のまま書ける zoom を採る。zoom が特定 WebView で崩れたら rem に切り替えられるよう、寸法は CSS 変数経由で書く。

## UI 構成 (Vue)

- `scenes/`: Title / Opening / Menu / HeroineDetail (ダイアログでもよい) / BookSelect / InGame / Intermission / Result / StarPalette / StarEditor(dev)
- `dialogs/`: Skit / Tips / Options / Savedata / Credits / Language / Confirm / Organize / PanelPeek / Desc (個体説明)
- `components/`: Board, PanelCard, InventoryBar, EntityTile, LifePanel, StatusChips, BattlePanel, EnemyFigure, HeroineFigure (立ち絵), SdPiece (駒), Baloon, Shape (図形 SVG), Orn (飾り), Shop, DeckSummary ...
- `fragments/`: xqueens の FragmentManager 方式。core が `emit` したイベントを app 側の演出テーブルが Fragment (トースト、数字ポップ、カットイン) に変換する
- `stores/`: `session` (scene, dialogs, options, language, 音量)、`run` (current / displayed / playing / queue / dispatch)、`inspector` (dev)
- `sound/`: tricy の Vue 非依存 SoundManager (WebAudio、sound_master がファイル一覧)
- スタイル: xqueens 準拠のトークン (色・フォントサイズ・角丸) を `styles/tokens.scss` に置き、tale の tonmana ルール (図形の色ファミリー、パネル形状、落ち影) を移植する。コンポーネントは scoped

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

- **state インスペクタ** (08_verification): 右側に state ツリー、変更フィールドの発光、直前のコマンドとイベント、派生値の内訳、処理順ビューア
- URL ハッシュ直行 (`#ingame` `#battle` `#intermission` ...): dev 専用のシナリオルータが、固定シードでコマンドを打って状態を作る
- デバッグ関数 (通貨増加、全回復、任意章開始、戦闘即勝利、ステート付与、乱数リシード)
- `__IS_PROD__` で全部落ちる

## Electron main と他プラットフォーム

- main: ウィンドウ (1280x720、最小 1280x720、F11 全画面、状態記憶)、セーブファイル IPC (06_save)、外部リンクはブラウザへ
- Web: `base: "./"`、保存は localStorage。Android: Capacitor、戻るボタンでダイアログを閉じる、軽量モード既定 ON (xqueens 準拠)
