# 07 アウトゲームとシーン

xqueens のメニュー構造に寄せる (R1 Q29)。インゲームの見た目・演出は tale の レイアウト v2 と トンマナ統一を Vue で再現する。

## シーン遷移

```
Title ──(初回)──> Opening (スキット) ──> Menu ──> HeroineDetail ──> BookSelect ──> InGame ⇄ Intermission ──> Result ──> Menu
  │                                       │                                            │
  └─ つづきから ─────────────────────────────┴─────────────────────────────────────────┘ (run.json があれば復元)
```

| シーン | 内容 |
|---|---|
| Title | はじめる / つづきから (run があるとき) / オプション / セーブ管理 / クレジット / 言語 / エディション表示 |
| Opening | オラクルちゃんが本を持ち込む導入スキット (talk 形式)。初回のみ自動、以後はメニューから再生可 |
| Menu | ヒロイン一覧 (xqueens MenuScene 風のカード)。カード下に変動値の合計と本の戦績サマリ。フッターに オプション / 実績 (後) / オープニング再生 |
| HeroineDetail | 左: 立ち絵、プロフィール。右: 本の一覧 (自分の本を先頭、他人の本は「やり込み」扱い) と戦績、スターパレットへのボタン、スキット一覧 (既読 / 未開放と条件)、不利イベント再閲覧 (見たことのあるカットイン)。ここから BookSelect を兼ねてよい [案] |
| BookSelect | 本のカード (章一覧、本のルール、過酷さの閾値、ベスト記録)。「はじめる」/ 挑戦中のランがあれば「つづき」と「はじめから (破棄確認)」 |
| StarPalette | プロト踏襲 (3 層パララックス、原点からの道を一斉有効化、ゲート、右の詳細)。追加: 難易度プリセットボタン (イージー / ノーマル / ハード = starPresets を適用、適用前に確認)。編集は BookSelect 前のみ |
| InGame | tale のレイアウト v2 (立ち絵右、左カラム、盤面、インベントリ帯、下から生える戦闘パネル)。右上に 音量 / 高速化 / (dev) インスペクタ。右クリックで個体説明 / tips |
| Intermission | 次章の山札公開、ショップ (6 枠 + 引き直し)、回復、整理 (D&D)。本のルールの再表示 |
| Result | ノーマル / ハッピー / 敗北の 3 種。変動値、有効ノード、獲得クラウン、過酷さ、ベスト更新。敗北・完走のスキット (scene 形式) はここから再生 |

共通ダイアログ: Skit (talk / scene)、Tips、Options、Savedata、Credits、Language、Confirm、Organize、PanelPeek、Desc (個体説明)、Volume。

## スキット

| trigger | 形式 | 場面 |
|---|---|---|
| opening | talk | 初回起動 |
| bookStart / bossBefore / bookClear | talk | 章の開始 / ボス前 / 最終章クリア (プロトの dungeonStart 等) |
| extraStart | talk | Extra Chapter 突入 (本の呪いとの対峙) |
| happyEnd / normalEnd | scene | 完走イベント (一枚絵) |
| lose | scene | 敗北イベント (一枚絵) |

scene 形式の素材は秘匿シーン (`grimoire_scenes/`) から読み、健全版では差し替えか除外 (09)。

## 難易度プリセット (R1 Q28)

- 初回起動 (Opening の後) に難易度を尋ねる。イージーなら各ヒロインの `starPresets(easy)` を有効化、ノーマルは全部オフ、ハードは `starPresets(hard)` (例: -10 になる組み合わせ)
- スターパレット画面にも同じ 3 ボタン。押すと現在の有効ノードを捨ててプリセットを適用 (確認あり)。プリセットの中身はマスタなのでユーザが調整できる
- プリセットにゲート未達ノードが含まれていたら、そのノードは有効化しない (starNormalize)

## インゲーム HUD の対応

02 の「画面と state の対応」に従う。tale で決めた図形の色ファミリー (攻=金 / 防=青 / ライフ=緑 / 害=桃)、パネル形状の意味、落ち影、飾り (ornHead 等) は `app/styles` と `components/Shape.vue` / `Orn.vue` に移植する。

## 開発用ハッシュ直行

tale と同じ発想で `#ingame` `#battle` `#badbattle` `#organize` `#intermission` `#skit` `#star` `#result` `#shapes` `#cards` `#sd` `#inv` を dev 限定で用意する。固定シードのコマンド列で状態を作るので、スクショが安定する。
