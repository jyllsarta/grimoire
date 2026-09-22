/**
 * edition ごとのアセット除外設定 (xqueens v1.3.0 方式)
 *
 * - パスは `src/renderer/public` からの相対パスで指定する
 * - `*` は `/` をまたがないワイルドカード、`**` は `/` をまたぐワイルドカード
 * - `!` プレフィックスは否定 (許可) パターン。肯定パターンにマッチしても否定にもマッチすれば除外しない
 *
 * オーバーレイ (アセット差し替え)
 * - EDITION_ASSET_OVERLAY_EDITIONS に列挙した profile キーは、除外フィルタ適用後に
 *   `src/renderer/overlay_assets/<key>/` の中身を無条件で上書きコピーする
 */
export const EDITION_ASSET_BLACKLIST = {
  common: [],
  trial: [],
  cien: [],
  cienTrial: [],
  // 健全版は秘匿シーン (一枚絵・カットイン) をまるごと落とす (09_assets)
  clean: ["grimoire_scenes/**"],
};

export const EDITION_ASSET_OVERLAY_EDITIONS = ["clean"];
