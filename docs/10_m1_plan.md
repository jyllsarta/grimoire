# 10 M1 スキャフォールドの着手メモ

設計書 (00〜09) に書かなかった、作業を始めるときに要る実務情報。設計が変わったらこのメモより設計書を優先する。

## 状態 (2026-09-22)

- 設計書 v1.2 をユーザが承認 (「すべて OK」)。次は M1 = スキャフォールド + 基盤
- 作業ブランチは `feature/m1-scaffold`。master へのマージはユーザ
- **M1 の手順 1〜9 は着手済み** (下の「M1 でやったこと・残したこと」)。見た目の承認待ち

## M1 でやったこと・残したこと

やったこと (2026-09-22):

- electron-vite 5 + **vite 7** (electron-vite 5 の peer が vite 5〜7 のため 8 は見送り) + vitest 5 + electron 44 + vue 3.5 + pinia 4 + eslint 10 + prettier。`npm test` / `npm run test:fuzz` / `npm run selftest` / `npm run lint` が通る
- エディション基盤 (config / scripts / data-if / `__IS_X__` / `@masterdata` alias → `masterdata/<profile>`)、profile は base / trial / cien / cien_trial / clean
- core: state (schema / 不変条件 / phase)、rng (xoshiro128**)、uid、master (注入式アクセサ + レジストリ駆動の検証)、timeline (steps / standard / bus / derive / sources)、効果モジュールのレジストリと M1 ぶんの効果 (status 12 / costume 4 / bookRule 2 / passive 3 / relic 6 / star 14 / item 4 / ability 2 / enemyAction 7 / eventEffect 7)、コマンド一式 (02 の表 + `debug.*`)、advance、outbox、run (newRun / serialize / migrate)
- tools: lib / import (全 profile 生成) / push / sheets / format / sync.ps1 / shot (dev サーバ URL) / gen_schema (data/SCHEMA.md) / placeholders (assets/PLACEHOLDERS.md) / selftest
- data: 05 の全テーブルの CSV (デスサイズちゃん 1 / オラクルちゃん 0 / placeholder 敵 1〜4 / 9 系)。生成物 `src/renderer/src/masterdata/<profile>/` もコミット。スプレッドシートは `push.js --create` で新規作成済み (`data/sheet_id.txt`)
- app: stores (session / run / inspector)、StepMover + 待ち時間の表、sound (tricy 方式 + 一発物 → SE の表)、fragments (MessageBar / Toast / NumberPop)、tokens.scss、viewport (CSS zoom)、インスペクタ (state ツリー / コマンドと一発物 / 派生値の内訳 / 処理順 / 不変条件とマスタ警告 / 操作)、シーンの骨格 (Title / Menu / InGame / Intermission / Result)、ハッシュ直行 (`#ingame` `#battle` `#badbattle` `#intermission` `#result` `#starclear` `#autotest`。`,inspector` を付けるとインスペクタを開いた状態)
- platform: storage (Electron ファイル / localStorage / メモリ)、edition、viewport、window。main は save/ の原子更新 + .bak
- test: harness (run_game / auto_play / run_until / invariants / explain)、unit (rng / run / battle / order / poison / master / smoke)、fuzz (150 ラン)

設計からの逸脱 (設計書側に反映済み or 要確認):

- 敵アクションの「なにもしない」は `rest` にした (`sleep` は statuses.key の眠りと衝突するため。05 の enemyAction キー一覧を参照)
- 不変条件「battle.panelUid は board.cells のどれかで kind=enemy」は `battle.result === "victory"` のとき (boardUpdate 後、closeBattle 待ち) は見ない (02 に追記)
- レリック maxHpPlus の「現在値も同時に増える」は未実装 (派生 maxHp にだけ乗る)。M2 で `relic.acquired` 的な発火点を決める

残したこと (M2 以降):

- 効果モジュールの残り (tale の item 17 / ability 6 / passive 10 / relic 16 / enemyAction 11 / star 31 / recharge 7 のうち M1 に入れなかったもの)、ディレイ系、混乱の詳細、ショップの枠配分 (05)、リチャージ条件の query
- スターパレット (有効ノード → star.effects のスナップショット)、スキット、tips、セーブ管理ダイアログ、オプションダイアログ、言語
- tale/tools の sd_outline.py / star_outline.py / editor.js (M3)
- Capacitor (Android) の依存は未追加。`__IS_ANDROID__` の分岐だけ置いてある
- ボットは全敗 (勝率は参考値)。マスタとボットの手は M2 で
- R2 末尾の「仮の解釈 4 点」(眠りの解除はシールド吸収でも / 混乱の全装備 OFF は付与後最初の turn.start / クロスブレイクの過酷さは別カウンタ・同じ重み / Extra Chapter は通常章形式) は異論が出ていないので採用

## M1 の手順

1. **雛形**: electron-vite (Vue) の雛形を最新版で作り、package.json のスクリプトを xqueens v1.3.0 に合わせる (`dev` / `dev:debug` (REMOTE_DEBUGGING_PORT=9222) / `dev:<edition>` / `build:<edition>` / `test` / `test:fuzz` / `test:full` / `selftest` / `lint` / `format`)。eslint 10 + prettier、vitest (happy-dom)。`.gitignore`: node_modules / out / dist / .generated / tmp / save / tools/client_secret.json
2. **エディション基盤**: `config/editions.mjs` は xqueens の **v1.3.0 ブランチ** にある (`git -C c:/Users/jyll/xqueens show v1.3.0:config/editions.mjs`。作業コピーは v1.2.0 なので注意)。`scripts/prepare-edition-public-assets.mjs`、`scripts/edition-marker.mjs`、`electron.vite.config.mjs` の data-if 変換と `__IS_X__` 定義、`@masterdata` alias も同じブランチから
3. **core の骨格** (中身は空でも形を先に): `state/schema.js` (初期状態 + 不変条件)、`rng.js` (xoshiro128**、seed → s[4])、`uid.js` (10001 開始)、`master/tables.js` + `index.js` + `validate.js`、`timeline/steps.js` (03 の表をそのままデータに) + `standard.js` + `bus.js` + `derive.js`、`effects/define.js` + `index.js`、`commands/index.js` + `advance.js`、`outbox.js`、`run.js`
4. **tools**: tale の `tools/` を移植 (`lib.js` の TABLES は `core/master/tables.js` を読む形に、`import.js` は profile 別に `src/renderer/src/masterdata/<profile>/` へ生成、`push.js` / `sheets.js` / `sync.ps1` / `format.js` はそのまま、`shot.js` は vite dev サーバの URL を撮る形に)。新規: `gen_schema.js` (レジストリ → data/SCHEMA.md)、`placeholders.js` (素材コピーと出所記録)
5. **data**: 05 のテーブルで CSV を新規に作る。中身はデスサイズちゃん (1) / オラクルちゃん (0) / placeholder 敵 1〜4 / テスト用 9 系だけ。スプレッドシートは `push.js --create` で **新規に** 作る (tale のシートは触らない。`data/sheet_id.txt` も新規)
6. **app の骨格**: `main.js` / `App.vue` / GameWindow (scene 切替) / stores (session / run / inspector) / StepMover / sound (tricy の SoundManager) / fragments (xqueens 方式) / `styles/tokens.scss` (xqueens の variables.scss + tale の style.css 冒頭) / `platform/viewport.js` (CSS zoom) / inspector
7. **platform**: storage アダプタ (Electron ファイル / localStorage)、`src/main/index.js` (xqueens の ウィンドウ状態記憶・セーブ IPC・F11)、preload
8. **test**: harness (`runGame` / `runUntil` / `invariants` / `autoPlay` / `explain`)、unit の smoke、`selftest` スクリプト
9. **確認**: `npm run dev` で起動 / `npm test` / `npm run selftest` / `node tools/shot.js` で仮シーンのスクショ / インスペクタに state が出る

## 移植元の対応

| 元 | 先 | 備考 |
|---|---|---|
| tale/tools/{lib,import,push,sheets,format}.js, sync.ps1 | tools/ | 記法は 05。lib.js の TABLES は core の tables.js に移す |
| tale/tools/shot.js | tools/shot.js | headless Chrome (`--headless=new --window-size=1296,815 --virtual-time-budget`)。1296x815 の外寸 ≒ 1280x720 の内寸 |
| tale/tools/{sd_outline,star_outline}.py | tools/ | pillow / numpy / scipy。SD の白フチ (半径 52px の円形膨張) と星座の折れ線 |
| tale/tools/editor.js | tools/editor.js | スターパレット エディタ用ローカルサーバ (port 8765)。M3 で |
| tale/tools/client_secret.json | tools/client_secret.json | Sheets API の自前 OAuth クライアント。gitignore。**コピーして使う** (作り方は tale/README.md) |
| tale/assets/character/11 (立ち絵) | assets/characters/1/stand/ | wing.png / base.png / face/<n>.png。11 = デスサイズちゃんの仮 |
| tale/assets/character/12 | assets/characters/0/stand/ | オラクルちゃんの仮 (トリシー) |
| tale/assets/sd/11 | assets/characters/1/sd/ | `bs_<key>.png` → `status_<key>.png`、`7.png` `8.png` → `face/7.png` `face/8.png`、`costume_*` / `outline_*` はそのまま、固有バステの仮は `unique_ds_unique1.png` = costume_special1 のコピー、`unique_ds_unique2.png` = costume_full のコピー |
| tale/assets/{icons,backgrounds,sounds,fonts,frames,etc,star} | assets/ 同名 | frames/baloon_mirror.png (吹き出し)、etc/coin.png、etc/crown.svg |
| tale/data/*.csv | data/ (作り直し) | dungeons → books、layers → chapters、characters の role 無し、statuses 新設、events の kind/slot。値の意味は tale/data/SCHEMA.md と tale/specs.md が正 |
| tale/engine.js | core/effects/* | 効果の意味の参照元。type ごとに 1 モジュールへ分解 (item 17 種、ability 6 種、passive 10 種、relic 16 種、enemyAction 11 種、star 31 種、recharge 7 種) |
| tale/ui.js | app/ | 図形 SVG (SHAPE_SVG / shapePath / cardHtml)、ornHead 等の飾り、SD_FACE_MAP、レイアウト v2、tonmana。ロジックは持ち込まない |
| xqueens v1.3.0 config/scripts/electron.vite.config | 同名 | エディション基盤 |
| xqueens vue/{Baloon,SkitDialog,GlobalTipsDialog,GlobalSoundManager,TouchableCharacter,NumeratableNumber,PhaseMover,Fragments,fragments/MessageBar}.vue | app/ | Baloon は tale で移植済みの数値 (slice 60 / width 54 / outset 8)。PhaseMover → StepMover。GlobalSoundManager の BGM ループ点はコード側 |
| xqueens js/{savedata,masterdata,st}.js, main/index.js, androidLongPress.js, backgroundClipTextProbe.js | platform/ app/ | セーブの validate/migrate、Masterdata.switchLanguage、systemTexts の T()、ウィンドウ状態、Android 長押し |
| tricy src/renderer/src/{sound/sound_manager.js, game/outbox.js, tools/gen_placeholder_sounds.mjs} | app/sound, core/outbox.js, tools/ | Vue 非依存の音、購読方式の outbox、仮音源合成 |
| xqueens test/harness/{run_game,auto_play,invariants,explain}.js | test/harness/ | console 捕捉 → 自動プレイ → 診断の型 |

## 落とし穴 (過去に踏んだもの)

- electron-vite dev はエージェント環境の `ELECTRON_RUN_AS_NODE=1` が残っていると起動しない。Git Bash なら `env -u ELECTRON_RUN_AS_NODE npm run dev:debug`。ユーザが `dev:debug` (9222) を起動済みなら chrome-devtools MCP でそれを使う (curl http://localhost:9222/json で確認)
- 新規アセットを public に足したら dev サーバを再起動 (起動時スナップショット)
- シンボリックリンク (`grimoire_scenes`) は管理者 PowerShell で `New-Item -ItemType SymbolicLink`
- Sheets: gcloud 内蔵 OAuth クライアントは sheets スコープで弾かれるので自前クライアント必須。テスト中アプリのリフレッシュトークンは 7 日で失効 → `sync.ps1 -Relogin`。**-Relogin は認証後にシート取り込みを走らせるので、未 push の CSV 編集は先に stash**。gviz 公開 CSV 方式はシート非公開だと 401
- PowerShell で `--scopes` の値はクォート (カンマで配列化される)。Node から gcloud.cmd は execSync + クォート
- 許可プロンプトを減らす: リポジトリ直下から `node tools/x.js ...` のように単独 1 行で打つ (cd / && / for / 変数代入を混ぜない)。`.claude/settings.json` の allowlist を最初に整える
- headless Chrome で `#intermission` 系のダイアログ上端が切れて写ることがある (tale で既知、原因未調査)
- Read で画像を一度に 12 枚以上読むと失敗する。10 枚前後ずつ。並列 Read の結果順は要求順と一致しないことがある
- NekoSpoon に無い記号 (» など) は空白になる。図形の文字は ASCII に限定
- CSS zoom の挙動確認は Chrome 153 で済み (01)。Electron 44 の Chromium でも同じはずだが、スキャフォールド時に同じテストページで再確認する
- electron-vite 5 + vite 8 + vitest 5 は未検証の組み合わせ。動かなければ 1 段下げる

## ユーザとの進め方 (grimoire でも同じ)

- 仕様の不明点は着手前に Q1..Qn 形式でまとめて出す (AskUserQuestion は使わない)。回答は docs/qa/ に転記
- ユーザは作業をリアルタイムで見ている。途中の質問や拒否理由に疑問文があれば止まって答える
- 見た目の確認は `tmp/` に画像を保存してパスを伝える。見た目が認められるまでコミットしない (ロジックはテストが通ればコミット可)
- セリフの最終文言はユーザの領分。たたき台は歓迎
- マスタの追加を嫌わず、必要なら人間に依頼する。実装とマスタの不整合はフォールバックで吸収しない
- enemyActions は敵 1 体 4 行 (`_skip`)、テスト用 ID は 9 系。ID 空間の分割は人間用
