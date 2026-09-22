# 09 素材

## 置き場

- 通常素材: `src/renderer/public/assets/` (モノレポ同居)
- 秘匿素材 (一枚絵スチル、カットイン): `src/renderer/public/grimoire_scenes/` → 別リポ `grimoire_scenes` への symlink (R1 Q4)。エディションの blacklist で健全版から落とす
- tale / xqueens から流用するプレースホルダは `tools/placeholders.js` がコピーし、出所を `assets/PLACEHOLDERS.md` に記録する。差し替えは同名ファイルの上書きだけ (コード変更なし)。完全な仮素材 (placehold.jp のようなもの) は使わない (R1 Q33)

## 命名規約

| 種類 | パス | 備考 |
|---|---|---|
| 立ち絵 | `assets/characters/<characterId>/stand/wing.png`, `base.png`, `face/<faceId>.png` | 1600x2400、重ねるだけ。表情番号の意味は xqueens と共通 |
| SD (駒) | `assets/characters/<characterId>/sd/wing.png`, `costume_<costumeKey>.png`, `unique_<statusKey>.png`, `face/<n>.png`, `status_<statusKey>.png`, `outline_<layerKey>.png` | outline は `tools/sd_outline.py` が生成 (衣装 / 固有ごと) |
| オラクルちゃん | `assets/characters/0/stand/...` | 立ち絵のみ |
| 敵アイコン | `assets/icons/<name>.gif` (24px ドット絵、流用) / `assets/icons/<name>.svg` (新規) | 01 のドット絵倍率規則 |
| 図形・ノード・バステアイコン | app の SVG (コード) | 素材ではない。仮のもので、いつか描き直す |
| 背景 | `assets/backgrounds/<name>.png` | 章の battleBg、メニュー背景 |
| スターパレット | `assets/star/<characterId>.outlines.js` (輪郭の折れ線、`tools/star_outline.py` 生成) | |
| 一枚絵 | `grimoire_scenes/scene<skitId>_<n>.png` | xqueens と同じ命名 |
| カットイン | `grimoire_scenes/cutin<eventId>.png` | 不利イベント。画面中央に軽く出るデフォルメ絵 (全画面ではない)。透過 PNG、目安 480x480 |
| 音 | `assets/sounds/se/<key>.ogg`, `assets/sounds/bgm/<key>.ogg` | ファイル一覧がマスタ (`app/sound/sound_master.js`)。ループ点はコード側 (xqueens の知見) |
| フォント | `assets/fonts/NekoSpoon.ttf` ほか | |

## プレースホルダの割り当て (案、R2 で確認)

| 本番 | 仮に使う素材 |
|---|---|
| デスサイズちゃん (1) 立ち絵・SD・衣装差分・バステ差分 | tale の シンティラ (11) 一式 (衣装 / bs_* 含む) |
| 固有バステ 1 / 2 の SD | tale の costume_special1 / costume_full を仮当て |
| オラクルちゃん (0) 立ち絵 | tale の トリシー (12) |
| 敵 | tale の icons (rabbit / nasu / skeleton ...) |
| 一枚絵 / カットイン | xqueens_scenes から適当に (秘匿 symlink 側) |
| BGM / SE | tale が使っている xqueens の音 |
