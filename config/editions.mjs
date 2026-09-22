/**
 * ビルドエディション定義 (xqueens v1.3.0 方式)
 *
 * エディションは環境変数 EDITION (例: EDITION=trial) 1 本で指定する。
 * 「エディション名 → フラグ集合」のプリセットをここ 1 箇所にまとめる。
 *
 * PROD はここに含めない: PROD は NODE_ENV=production 由来の「リリースビルドかどうか」で、
 * エディション (配布形態) ではない (electron.vite.config.mjs 側で別途合成する)。
 */

export const EDITION_FLAG_NAMES = ["TRIAL", "CIEN", "CLEAN", "WEB", "STATIC_WEB", "ANDROID", "STEAM"];

export const EDITION_PRESETS = {
  prod: [], // DLsite / FANZA 通常製品版
  trial: ["TRIAL"], // DL 体験版
  web_trial: ["TRIAL", "WEB"], // ホスティング型 Web 体験版
  static_web_trial: ["TRIAL", "WEB", "STATIC_WEB"], // 静的 zip の Web 体験版
  cien: ["CIEN"], // ci-en 版
  cien_web: ["CIEN", "WEB"], // ci-en web 版
  android: ["ANDROID", "WEB"], // 製品版同梱 apk
  steam: ["STEAM"], // Steam パッチ想定国内版
  steam_clean: ["STEAM", "CLEAN"], // Steam 健全版
};

/**
 * エディション名から EDITION_FLAG_NAMES 全キーの boolean オブジェクトを返す。
 * 未指定 / 空文字は "prod" 扱い。
 */
export function resolveEditionFlags(editionName) {
  const name = editionName || "prod";
  const activeFlags = EDITION_PRESETS[name];
  if (!activeFlags) {
    throw new Error(`Unknown EDITION "${name}". Available editions: ${Object.keys(EDITION_PRESETS).join(", ")}`);
  }
  return Object.fromEntries(EDITION_FLAG_NAMES.map((flagName) => [flagName, activeFlags.includes(flagName)]));
}

/**
 * マスタの profile (05_masterdata)。tools/import.js が全 profile ぶん生成し、
 * electron.vite.config.mjs の @masterdata alias がフラグからこの名前を選ぶ。
 */
export const MASTERDATA_PROFILES = ["base", "trial", "cien", "cien_trial", "clean"];

export function resolveMasterdataProfile(flags) {
  if (flags.CLEAN) return "clean";
  if (flags.CIEN && flags.TRIAL) return "cien_trial";
  if (flags.TRIAL) return "trial";
  if (flags.CIEN) return "cien";
  return "base";
}

/**
 * profile が持つエディション条件 (マスタの _isTrial / _isCien / _isClean 列の判定に使う)。
 * 列の値: 空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ出力。
 */
export function profileFlags(profile) {
  return {
    trial: profile === "trial" || profile === "cien_trial",
    cien: profile === "cien" || profile === "cien_trial",
    clean: profile === "clean",
  };
}
