# 09 素材

## 置き場

- 通常素材: `src/renderer/public/assets/` (モノレポ同居)
- 秘匿素材 (一枚絵スチル、カットイン): `src/renderer/public/grimoire_scenes/` → 別リポ `grimoire_scenes` への symlink (R1 Q4)。エディションの blacklist で健全版から落とす
- tale / xqueens から流用するプレースホルダは `tools/placeholders.js` がコピーし、出所を `assets/PLACEHOLDERS.md` に記録する。差し替えは同名ファイルの上書きだけ (コード変更なし)。完全な仮素材 (placehold.jp のようなもの) は使わない (R1 Q33)
- **本番素材** (ユーザが用意した立ち絵 / SD) は `tools/art_sync.js` が素材フォルダ (既定 `C:\Users\jyll\OneDrive\tale`、環境変数 `GRIMOIRE_ART_DIR`) から命名規約でコピーし、出所を `assets/ART_SOURCES.md` に記録する。素材フォルダ側の名前 (`heart.png` → `status_arousal.png`、`nebaneba.png` → `status_sticky.png`、`half.png` → `costume_half.png` など) の対応はスクリプトの先頭にある

## 命名規約

| 種類 | パス | 備考 |
|---|---|---|
| 立ち絵 | `assets/characters/<characterId>/stand/wing.png`, `base.png`, `face/<faceId>.png` | 1600x2400、重ねるだけ。表情番号の意味は xqueens と共通 |
| SD (駒) | `assets/characters/<characterId>/sd/wing.png`, `base.png` (通常衣装込み), `costume_<costumeKey>.png`, `unique_<statusKey>.png`, `face/<n>.png`, `status_<statusKey>.png`, `outline_<layerKey>.png` | outline は `python tools/sd_outline.py` が生成 (`outline_normal` = base、衣装 / 固有ごとに `outline_<key>`)。端まで描かれた素材でもフチが切れないよう、outline だけ素材より四方 1/32 ずつ広いキャンバス (2048px なら 2176px)。SdPiece が `SD_OUTLINE_PAD` の分だけはみ出して重ねる。素材を差し替えたら再生成。描画の重ね順は `app/ui/sd.js` |
| オラクルちゃん | `assets/characters/0/stand/...` | 立ち絵のみ |
| 敵アイコン | `assets/icons/<name>.gif` (24px ドット絵、流用) / `assets/icons/<name>.svg` (新規) | 01 のドット絵倍率規則 |
| 図形・ノード・バステアイコン | app の SVG (コード) | 素材ではない。仮のもので、いつか描き直す |
| 背景 | `assets/backgrounds/<name>.png` | 章の battleBg、メニュー背景 |
| スターパレット | `assets/star/outlines.json` (characterId → 立ち絵の輪郭の折れ線と星の位置、座標 800x1200。`python tools/star_outline.py` 生成) | StarPaletteScene が fetch してインライン SVG で描く |
| 一枚絵 | `grimoire_scenes/scene<skitId>_<n>.png` | xqueens と同じ命名 |
| カットイン | `grimoire_scenes/cutin<eventId>.png` | 不利イベント。画面中央に軽く出るデフォルメ絵 (全画面ではない)。透過 PNG、目安 480x480 |
| 音 | `assets/sounds/se/<key>.ogg`, `assets/sounds/bgm/<key>.ogg` | ファイル一覧がマスタ (`app/sound/sound_master.js`)。ループ点はコード側 (xqueens の知見) |
| フォント | `assets/fonts/NekoSpoon.ttf` ほか | |

## 素材の状態 (2026-09-26)

| 本番 | 状態 |
|---|---|
| デスサイズちゃん (1) 立ち絵 (base / wing / face 1..38, 91..93) | **本番素材** (`OneDrive\tale\1`) |
| デスサイズちゃん (1) SD (base / wing / face 1..8 / costume half, full, special1 / status poison, sleep, paralyze, arousal, sticky / 体温上昇 `unique_ds_fever` = 素材の special2) | **本番素材** (`OneDrive\tale\sd`)。共通バステはデスサイズちゃん規格で作ったが今後全キャラで使い回す可能性大 |
| 衣装 みずぎ の SD (`costume_special1`) | 未着。仮 = `base` のコピー (通常衣装のまま)。素材フォルダに `sd/swimsuit.png` が来たら art_sync が拾う |
| 混乱の SD (`status_confusion`) | 未着 |
| 逆さ吊りトラップのカットイン (`grimoire_scenes/cutin11.png`)、各種スキット用スチル | 未着 (仮素材で実装を進めてよい) |

## プレースホルダの割り当て (残り)

| 本番 | 仮に使う素材 |
|---|---|
| オラクルちゃん (0) 立ち絵 | tale の トリシー (12) |
| 敵 | tale の icons (rabbit / nasu / skeleton ...) |
| 一枚絵 / カットイン | xqueens_scenes から適当に (秘匿 symlink 側) |
| BGM / SE | tale が使っている xqueens の音 |
