# 07 アウトゲームとシーン

xqueens のメニュー構造に寄せる (R1 Q29)。インゲームの見た目・演出は tale の レイアウト v2 と トンマナ統一を Vue で再現する。

## シーン遷移

```
Title ──(初回)──> Opening (スキット) ──> Menu ──> CharacterDetail ──> BookSelect ──> InGame ⇄ Intermission ──> Result ──> Menu
  │                                       │                                            │
  └─ つづきから ─────────────────────────────┴─────────────────────────────────────────┘ (run.json があれば復元)
```

| シーン | 内容 |
|---|---|
| Title | はじめる / つづきから (run があるとき) / オプション / セーブ管理 / クレジット / 言語 / エディション表示 |
| Opening | オラクルちゃんが本を持ち込む導入スキット (talk 形式)。登場はオラクルちゃん / おにーさん / デスサイズちゃん。表情番号は xqueens 共通 (変える可能性あり)。初回のみ自動、以後はメニューから再生可 |
| Menu | 本を持つ character (ヒロイン) の一覧 (xqueens MenuScene 風のカード)。カード下に変動値の合計と本の戦績サマリ。フッターに オプション / 実績 (後) / オープニング再生 |
| CharacterDetail | 左: 立ち絵、プロフィール。右: 本の一覧 (自分の本を先頭、他人の本は「やり込み」扱い) と戦績、スターパレットへのボタン、スキット一覧 (既読 / 未開放と条件)、不利イベント再閲覧 (見たことのあるカットイン)。ここから BookSelect を兼ねてよい [案]。xqueens の CharacterDetailDialog と同じ名前 |
| BookSelect | 本のカード (章一覧 + Extra Chapter、本のルール、過酷さの閾値、ベスト記録)。「はじめる」/ 挑戦中のランがあれば「つづき」と「はじめから (破棄確認。戦績に数えない)」 |
| StarPalette | プロト踏襲 (3 層パララックス、原点からの道を一斉有効化、ゲート、右の詳細)。追加: 難易度プリセットボタン (イージー / ノーマル / ハード = starPresets を適用、適用前に確認)。編集は BookSelect 前のみ |
| InGame | tale のレイアウト v2 (立ち絵右、左カラム、盤面、インベントリ帯、下から生える戦闘パネル)。右上に 音量 / 高速化 / (dev) インスペクタ。右クリックで個体説明 / tips。「本の要求」メーター (過酷さ) と本のルールを章名の近くに常時表示。眠り中の攻撃ボタンは zzz の記号。結晶化中の にげる ボタンは結晶化のテクスチャ (許可 `canFlee`、素材は人間側)。敵の行動予告は次のルーチン 1 つだけ (全ルーチンは戦闘パネルの行動メモ。R3 Q21)。イベントの条件付き選択肢は条件を満たさないと伏せる (青選択肢風)。リーサルサイズ発動は専用フラグメント。アビリティのリチャージ条件は query `rechargeInfo` + systemTexts `recharge.<type>` の文言 (文字に頼らない可視化は後日検討。ロードマップ) |
| Intermission | 次章の山札公開、ショップ (その他 4 + レリック 1 + レア 1、引き直しは その他 4 + レリック 2)、回復 (価格は次の章の healPrice)、整理 (D&D)、非戦闘で使えるアイテム。本のルールの再表示。最終章クリアで閾値達成なら、この幕間の後に extraStart スキット → Extra Chapter |
| Result | ノーマル / ハッピー / 敗北の 3 種。変動値、有効ノード、獲得クラウン、過酷さ、ベスト更新。敗北・完走のスキット (scene 形式) はここから再生 |

共通ダイアログ: Skit (talk / scene)、Tips、Options、Savedata、Credits、Language、Confirm、Organize、PanelPeek、Detail (個体の詳細)、Volume。

## スキット

| trigger | 形式 | 場面 |
|---|---|---|
| opening | talk | 初回起動 |
| bookStart / bossBefore / bookClear | talk | 章の開始 / ボス前 / 最終章クリア (プロトの dungeonStart 等) |
| extraStart | talk | Extra Chapter 突入 (本の呪いとの対峙) |
| happyEnd / normalEnd | scene | 完走イベント (一枚絵) |
| lose | scene | 敗北イベント (一枚絵) |

scene 形式の素材は秘匿シーン (`grimoire_scenes/`) から読み、健全版では差し替えか除外 (09)。
不利イベントのカットインはスキットではなく、イベント結果の表示中に画面中央へ軽くデフォルメ絵を出すオーバーレイ (全画面は覆わない)。ヒロイン詳細から再閲覧できる。

## 用語の表示名

「本のルール」「過酷さ」「Extra Chapter」はそのまま表示名に使う。コイン / ジュエル / クラウン / 変動値 / 本 / 章 も同じ (R2 Q36)。

## 難易度プリセット (R1 Q28)

- 初回起動 (Opening の後) に難易度を尋ねる。イージーなら各ヒロインの `starPresets(easy)` を有効化、ノーマルは全部オフ、ハードは `starPresets(hard)` (例: -10 になる組み合わせ)
- スターパレット画面にも同じ 3 ボタン。押すと現在の有効ノードを捨ててプリセットを適用 (確認あり)。プリセットの中身はマスタなのでユーザが調整できる
- プリセットにゲート未達ノードが含まれていたら、そのノードは有効化しない (starNormalize)

## インゲーム HUD の対応

02 の「画面と state の対応」に従う。tale で決めた図形の色ファミリー (攻=金 / 防=青 / ライフ=緑 / 害=桃)、パネル形状の意味、落ち影、飾り (ornHead 等) は `app/styles` と `components/Shape.vue` / `Ornament.vue` に移植する。本ごとのスキン (01) はトークンの上書きで、レイアウトは共通。

## 開発用ハッシュ直行

tale と同じ発想で `#title` `#menu` `#bookselect` `#star` `#ingame` `#battle` `#badbattle` `#peek` `#event` `#organize` `#intermission` `#result` `#skit` `#starclear` `#autotest` を dev 限定で用意する (`app/dev/scenarios.js`)。固定シードのコマンド列で状態を作るので、スクショが安定する。`node tools/shot.js <hash>...` で `tmp/shots/<hash>.png`。

## M3 の実装メモ (2026-09-26)

- シーン名は session.scene の `title` / `menu` / `bookSelect` / `star` / `inGame` (inGame の中で phase により InGame / Intermission / Result)。CharacterDetail は BookSelect が兼ねる (左にプロフィール / スターパレット / スキット一覧 / 見た不利イベント、右に本のカード)
- ダイアログは `session.openDialog(name, params)` → Promise (閉じるときの値で解決)。`app/dialogs/DialogHost.vue` の registry に名前 → コンポーネント。スキットは `app/flow/skits.js` の `playSkitFor(trigger, characterId)` (マスタに無ければ何もしない)
- 右クリック: `data-desc="<kind>:<id|key>"` (+ `data-desc-ref`) を持つ要素で個体説明、`data-tips="<key>"` で tips。GameWindow が拾う
- セリフは `app/stores/talk.js` (characterScripts の key。無ければ何も出ない)。演出の一発物 → セリフの対応は BattleLayer / InGameScene にある
- 幕間の立ち絵は右端に薄く出すだけ (吹き出しは出さない。ダイアログと重なるため)
