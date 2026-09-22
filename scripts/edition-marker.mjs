import fs from "node:fs";
import path from "node:path";

// どのエディションとして out/ を作ったかを記録するマーカー。
//
// なぜ環境変数を直接見ないのか:
//   npm scripts の `set "EDITION=trial" && electron-vite build` はそのコマンドのシェル内でしか効かず、
//   後続の別プロセス (electron-builder) には伝わらない。そのためエディションが確実に分かる
//   electron-vite ビルド時にファイルへ落とし、後段はそれを読む。out/ と必ず同じビルドの産物になる。
//
// 出力先が .generated/ なのは gitignore 済みで、files: の "out/**" に含まれない = 配布物に混ざらないため。
export const EDITION_MARKER_RELATIVE_PATH = ".generated/edition.json";

export function writeEditionMarker({ projectRoot, edition, buildFlags }) {
  const markerPath = path.resolve(projectRoot, EDITION_MARKER_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(markerPath), { recursive: true });
  fs.writeFileSync(markerPath, `${JSON.stringify({ edition, flags: buildFlags, generatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  return markerPath;
}
