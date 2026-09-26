# 10 M1 スキャフォールドの着手メモ

設計書 (00〜09) に書かなかった、作業を始めるときに要る実務情報。設計が変わったらこのメモより設計書を優先する。

## 状態 (2026-09-26)

- 設計書 v1.2 をユーザが承認 (「すべて OK」)。M1 = スキャフォールド + 基盤は済
- 作業ブランチは `feature/m1-scaffold`。master へのマージはユーザ
- M2 (コアロジック、デスサイズちゃん想定のデータ) は済 (下の「M2 でやったこと・残したこと」)
- **M3 (UI: tale のレイアウト v2 / トンマナ、アウトゲーム、ダイアログ、スキット) を実装済み** (下の「M3 でやったこと・残したこと」)。2026-09-26 にユーザが一通り確認して承認、コミット済み
- 承認後の手直し (2026-09-26): 吹き出しの文字色 (暗色の枠に暗色の文字で見えなかった)、勝利後の戦闘レイヤー自動クローズ (StepMover、`VICTORY_CLOSE_MS`)、白フチが素材の端で切れる問題 (outline を四方 1/32 広いキャンバスに)、結晶化 SD の取り込み (素材の special1.png が結晶化、みずぎは未着で仮)、`tools/sync.ps1` の UTF-8 BOM

## M3 でやったこと・残したこと

やったこと (2026-09-26):

- 見た目の土台: `app/ui/shapes.js` (図形 SVG) / `card_shape.js` (パネルとタイルの外形) / `entity_view.js` / `star_view.js` / `sd.js` (SD の重ね順と表情対応)、部品 `Shape` / `CardShape` / `Ornament` / `HpDots` / `StatusChips` / `SdPiece` / `CharacterFigure` / `PanelCard` / `EntityTile` / `InventoryStrip` (ドラッグ並べ替え) / `InventoryBar` / `LifePanel` / `DeckSummary` / `ChapterHead` / `BoardPanel` / `CornerButtons` / `EnemyVisual` / `BattleLayer` (下から生える戦闘パネル、裏の にげる / 行動メモ、床グリッド、数字とトースト)。`global.scss` に tale の汎用クラス (btn / orn_frame / peek_* / アニメ)
- ダイアログ (`app/dialogs/`): DialogHost / DialogFrame と PanelPeek / Event (条件付き選択肢は伏せる) / EventResult / Organize (並べ替え、棚、保留の解決) / Detail (右クリック) / Tips / Confirm / Deck / Skit (talk / scene) / Options / Savedata / Credits / Difficulty。`session.dialogs` はスタックで `openDialog` が Promise を返す
- シーン: Title (テキストロゴ) / Menu (ヒロインカード + 変動値) / BookSelect (プロフィール + スキット一覧 + 本のカード) / StarPalette (3 層パララックス、星座は `assets/star/outlines.json`) / InGame (レイアウト v2) / Intermission (1180x660 のダイアログ、レア枠リボン) / Result (変動値と有効ノード)。導線は `app/flow/title.js` (初回オープニング → 難易度) と `app/flow/skits.js`
- セリフ `talk` ストア + characterScripts のデスサイズちゃん分 (たたき台 40 行)、tips 30 件、skits 8 本 (opening / bookStart / bossBefore / bookClear / extraStart / happyEnd / normalEnd / lose) と skitLines (たたき台)、systemTexts 82〜315
- tools: `python tools/sd_outline.py` (白フチ。outline_normal / half / full / special1 / ds_crystal / ds_fever を生成済み)、`python tools/star_outline.py` (→ `assets/star/outlines.json`)。旧 `outlines.js` は削除。`#peek` `#event` `#organize` `#bookselect` `#star` `#skit` のハッシュ直行を追加
- 確認: `npm test` 54 / lint 0 / selftest OK。`tmp/shots/*.png` (title / menu / bookselect / star / ingame / battle / badbattle / peek / event / organize / intermission / result / skit)
- **実機テストプレイ** `node tools/playtest.js` (headless Chrome を CDP で操作し、本物の DOM をクリックして進めるボット。コンソールのエラー / Vue warn / 例外 / 詰まりを集める)。`--cheat` で回復と通貨を足して Extra Chapter まで、`--resume` でラン中にページを読み直して つづきから を通す、`--runs N --steps N --verbose`。これで見つけて直したもの: 勝利直後の BattleLayer (パネルが盤面から消える)、イベント / 覗き見ダイアログが選択後に落下してきた別パネルを読む (開いた時点のパネルを掴む)。chrome-devtools MCP は `.mcp.json` に登録済み (セッション再起動で有効)

残したこと (M4 以降、または素材待ち):

- 一枚絵 (`grimoire_scenes/scene<skitId>_<n>.png`) とカットイン (`cutin11.png`) の素材。無い間は scene 形式のスキットは「(この場面の絵は準備中)」、カットインは出ない
- セリフ / スキット / tips の最終文言 (ユーザの領分)。characterScripts のキー一覧は `data/characterScripts.csv`
- 混乱の SD、みずぎ (costume_special1) の SD、敵アイコンの本番
- 言語切替 (オプションに日本語表示のみ)、実績、`tools/editor.js` (スターパレットのエディタ)
- 演出の磨き: 敵撃破の消滅、パネル落下の物理、リーサルサイズ専用のカットイン風演出 (いまはトースト)、幕間の立ち絵の吹き出し
- ヒロインの 2 人目以降のとき: 本のカードの「やり込み」(他人の本) の見せ方、キャラカード横並びの幅

## M2 でやったこと・残したこと

やったこと (2026-09-26、R3 の回答と 11 の本番仕様を受けて):

- 敵のシールド (`enemy.shield`、`enemies.shield`、敵アクション `shield`、`damageEnemy` の pierceShield)、`enemy.killed` ステップ (just = ジャストリーサル)、`enemy.attack.before` (回避の無効化)、`relic.gained` (取得時の即時効果)、動詞 `gainRelic` / `removeStatus` / `gain` の preferPos、契約 `onTake` / `fire` / `check`、family `choiceCondition`、許可 `canFlee` / `canRepairCostume`、派生 `lethalThreshold`
- デスサイズちゃんの効果モジュール: statuses evade / focus / ds_crystal / ds_fever、relics lethalScythe / lethalThresholdPlus / firstTurnPierce / battleStartStatus、passive lethalThresholdPlus、item pierceAttack、ability selfStatus、bookRule statusOnJustLethal、eventEffects loseAllEntities / loseAllCoins / harshness / status の value2、choiceCondition wingsAndInventoryAtMost、star chapterEnemy / misfortuneCandidate
- マスタ: config の枠配分列、characters.wings / startRelicIds、enemies.shield、eventChoices.condition / value2。デスサイズちゃん想定のデータ一式 (敵 31〜39 / 51〜54 / 101〜104、章 1〜4、イベント 11 / 13、パネル 1011 / 2011 / 3011、レリック 11〜14)。数値は全部たたき台
- ショップの枠配分 (R3 Q18)、healPrice は次の章 (Q19)、query `rechargeInfo` / `eventChoices` / `nextRoutine` (Q20 / Q21)、スターパレットのコア `core/star/palette.js` (Q3)、ボットの貪欲化と到達章の集計 (Q4)、schemaVersion 2 のマイグレーション
- 素材: 本番の立ち絵と SD を `tools/art_sync.js` でコピー (09)。tale 時代の outline と unique_ds_unique* は削除
- テスト: `test/unit/deathscythe.test.js` (21)、`star.test.js` (5)、`book.test.js` (本 1 冊の完走 2 経路)。`npm test` 54 / fuzz 150 ラン / selftest 通過

ボットの結果 (たたき台の数値): 60 ラン全敗、到達は平均 1.18 章 (49 ランが 1 章クリア、11 ランが 2 章クリア。2 章の ぬし で止まる)。バランスはユーザがスプレッドシートで見る。`node tools/selftest.js --runs 60` で再計測

残したこと (M3 以降):

- (M3 で解消) 白フチ `tools/sd_outline.py` の移植と outline の再生成、SD の描画部品 (SdPiece)、結晶化テクスチャ (にげる ボタンの結晶オーバーレイ)、リーサルサイズ / 回避の演出 (トースト + セリフ)、条件付き選択肢の見せ方 (青い選択肢、満たさないと ？？？)
- tale のモジュールで未移植のもの (必要になったヒロインで足す)、`repairCostume`、ディレイ系のアビリティ本体
- リチャージ条件の「文字に頼らない可視化」、バランスの自動調整 (ロードマップ)
- R4: 11 の「未決」

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
- レリック maxHpPlus の「現在値も同時に増える」は M2 で `relic.gained` に載せた

M1 で残し、M2 で解消したもの: ショップの枠配分、リチャージ条件の query、スターパレットのコア、ボットの手。まだ残るもの:

- (M3 で解消) スキット、tips、セーブ管理ダイアログ、オプションダイアログ。言語切替は未 (日本語のみ)
- (M3 で解消) tale/tools の sd_outline.py / star_outline.py。editor.js は未
- Capacitor (Android) の依存は未追加。`__IS_ANDROID__` の分岐だけ置いてある
- R2 末尾の「仮の解釈 4 点」(眠りの解除はシールド吸収でも / 混乱の全装備 OFF は付与後最初の turn.start / クロスブレイクの過酷さは別カウンタ・同じ重み / Extra Chapter は通常章形式) は異論が出ていないので採用

## M1 の手順

1. **雛形**: electron-vite (Vue) の雛形を最新版で作り、package.json のスクリプトを xqueens v1.3.0 に合わせる (`dev` / `dev:debug` (REMOTE_DEBUGGING_PORT=9222) / `dev:<edition>` / `build:<edition>` / `test` / `test:fuzz` / `test:full` / `selftest` / `lint` / `format`)。eslint 10 + prettier、vitest (happy-dom)。`.gitignore`: node_modules / out / dist / .generated / tmp / save / tools/client_secret.json
2. **エディション基盤**: `config/editions.mjs` は xqueens の **v1.3.0 ブランチ** にある (`git -C c:/Users/jyll/xqueens show v1.3.0:config/editions.mjs`。作業コピーは v1.2.0 なので注意)。`scripts/prepare-edition-public-assets.mjs`、`scripts/edition-marker.mjs`、`electron.vite.config.mjs` の data-if 変換と `__IS_X__` 定義、`@masterdata` alias も同じブランチから
3. **core の骨格** (中身は空でも形を先に): `state/schema.js` (初期状態 + 不変条件)、`rng.js` (xoshiro128**、seed → s[4])、`uid.js` (10001 開始)、`master/tables.js` + `index.js` + `validate.js`、`steps/` (1 ステップ 1 ファイル + `index.js` の一覧 + `bus.js` のフック解決)、`derived/` `permissions/` `lists/` (1 つ 1 ファイル)、`effects/define.js` + `index.js` + family ごとの `sources.js`、`verbs/` (動詞)、`commands/index.js` + `advance.js`、`outbox.js`、`run.js`
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
- 真っ白なスクショ = 起動時の実行時エラー。`"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --enable-logging=stderr --v=0 --virtual-time-budget=7000 --dump-dom "http://localhost:5173/#title" 2>&1 | grep CONSOLE | grep -v -e "\[vite\]" -e AudioContext` でコンソールが読める。コンパイルエラーは vite が各モジュールの GET に 500 で返す
- `session.scene` の watch でダイアログを畳む処理は `flush: "sync"` にしてある。既定の post flush だと「setScene 直後に openDialog」が畳まれる (ハッシュ直行で dialog が出なかった原因)
- dev サーバは public のスナップショットを起動時に取るが、既存ディレクトリへのファイル追加 (outline_*.png、outlines.json) はそのまま配られた。ディレクトリを増やしたときだけ再起動
- Read で画像を一度に 12 枚以上読むと失敗する。10 枚前後ずつ。並列 Read の結果順は要求順と一致しないことがある
- NekoSpoon に無い記号 (» など) は空白になる。図形の文字は ASCII に限定
- CSS zoom の挙動確認は Chrome 153 で済み (01)。Electron 44 の Chromium でも同じはずだが、スキャフォールド時に同じテストページで再確認する
- electron-vite 5 + vite 8 + vitest 5 は未検証の組み合わせ。動かなければ 1 段下げる

## ユーザとの進め方 (grimoire でも同じ)

- 仕様の不明点は着手前に Q1..Qn 形式でまとめて出す (AskUserQuestion は使わない)。回答は docs/qa/ に転記
- ゲームバランスに関与する値でも、不変のグローバルな定数はモジュールに直接書いてよい。可変・複数種類をマスタで使い分けるときにマスタ化を検討する (R3 Q18)
- tale のモジュールは全部は移植しない。必要になったヒロインで足す。ただし足すときに不自然にならないよう契約点は先に用意する (R3 Q2)
- ユーザは作業をリアルタイムで見ている。途中の質問や拒否理由に疑問文があれば止まって答える
- 見た目の確認は `tmp/` に画像を保存してパスを伝える。見た目が認められるまでコミットしない (ロジックはテストが通ればコミット可)
- セリフの最終文言はユーザの領分。たたき台は歓迎
- マスタの追加を嫌わず、必要なら人間に依頼する。実装とマスタの不整合はフォールバックで吸収しない
- enemyActions は敵 1 体 4 行 (`_skip`)、テスト用 ID は 9 系。ID 空間の分割は人間用
