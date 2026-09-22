# 06 セーブ

2 種類の JSON を分けて持つ。

| 種類 | 内容 | 書くタイミング | スロット |
|---|---|---|---|
| 進行 (progress) | ラン外の永続データ | 変わった瞬間 (ラン終了、パレット変更、スキット既読、オプション) | 1 |
| ラン (run) | 02 の GameState まるごと | **コマンドが state を変えるたび** (ローグライク式オートセーブ) | 1 (挑戦中のラン) |

手動セーブは持たない (R1 Q25)。タイトルの「つづきから」は run があれば有効。

## progress の形 (v1)

```
{
  schemaVersion: 1,
  meta: { createdAt, updatedAt, appVersion, playTimeMs },
  flags: { sawOpening, difficultyChosen },
  options: { bgmVolume, seVolume, masterVolume, lightWeightMode, ... },
  language: "ja_jp",
  characters: {
    [characterId]: {
      star: { activeNodeIds: [], lastPreset: null|easy|normal|hard },
      totalCrowns: 0,
      records: {
        [bookId]: { tries, normalEnds, happyEnds, losses, bestDelta: null|int, bestHappyDelta: null|int }
      },
      skitsRead: { [skitId]: true },
      misfortunesSeen: { [eventId]: true },
    }
  },
  achievements: {}   // 後で
}
```

- 戦績: tries はラン開始時、normalEnds / happyEnds / losses は ending 確定時に +1 (Extra での敗北は losses と normalEnds の両方)。abandoned は tries だけ残り他は数えない。bestDelta は完走 (normal / happy) の最小 delta、bestHappyDelta は happy の最小 delta。ゲート `clearAny` は normalEnds + happyEnds、`happyAny` は happyEnds を見る
- xqueens の `Savedata` と同じく、読み込み時に `migrate` を通して欠けたキーを埋める (テンプレートとの型比較で壊れを検出)
- 進行データの初期化・エクスポート・インポートは「セーブ管理」ダイアログから (xqueens 準拠)

## run の形

`GameState` そのもの (02)。`meta.updatedAt` を更新して書く。読み込み時に `schemaVersion` が古ければ `migrations/run/` を順に当てる。当てられない (大きな構造変更) ときはランを破棄して通知する (ランは短いので許容)。

## 保存先

`platform/storage.js` のアダプタ 1 つに閉じる。`load(name)` / `save(name, json)` / `remove(name)`。

| 環境 | 場所 |
|---|---|
| Electron | 実行ファイルの隣の `save/` (xqueens と同じポータブル運用)。`progress.json` / `run.json`。書き込みは一時ファイル → rename の原子更新、直前版を `.bak` に残す。製品配布までに外部ツールの制約が来たら命名だけ合わせる (R1 Q26) |
| Web / Android | localStorage。キー `grimoire_<edition group>_<name>` |

エディション群: `prod` / `cien` / `trial` / `steam` (steam 系は共有) / `web`。

## オートセーブの規則

- app の dispatch がコマンド成功後に `current` を書く。同期書き込みが重い環境では直近 1 件だけを保留してデバウンスするが、**次のコマンドの前には必ず書き終わっている** こと
- 演出の途中で落ちた場合、再開は「コマンド完了後の状態」から。演出は再生しない
- ランを放棄 (`giveUp`, ending=abandoned) したら戦績には数えず run.json を消す。normal / happy / lose は progress に記録してから run.json を消す

## 開発用

- `#starclear` 相当の「セーブ初期化」ハッシュと、インスペクタの「state を JSON で保存 / 読み込み」で任意の状態を再現する
- テストは storage をメモリ実装に差し替える
