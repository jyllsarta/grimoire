// エディションフラグ (01)。renderer では __IS_X__ 定数 (electron.vite.config.mjs の define)。
// core は import しない (platform ← app の向きだけ)
export const edition = {
  name: __EDITION__,
  masterdataProfile: __MASTERDATA_PROFILE__,
  version: __APP_VERSION__,
  isProd: __IS_PROD__,
  isTrial: __IS_TRIAL__,
  isCien: __IS_CIEN__,
  isClean: __IS_CLEAN__,
  isWeb: __IS_WEB__,
  isStaticWeb: __IS_STATIC_WEB__,
  isAndroid: __IS_ANDROID__,
  isSteam: __IS_STEAM__,
};

// セーブキーのエディション群 (06): prod / cien / trial / steam (steam 系は共有) / web
export function saveGroup() {
  if (edition.isSteam) return "steam";
  if (edition.isTrial) return "trial";
  if (edition.isCien) return "cien";
  if (edition.isWeb) return "web";
  return "prod";
}

export const isElectron = typeof window !== "undefined" && !!window.electronAPI;
