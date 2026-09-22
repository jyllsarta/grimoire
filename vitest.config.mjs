import { resolve } from "path";
import { defineConfig } from "vitest/config";
import { EDITION_FLAG_NAMES } from "./config/editions.mjs";

// electron.vite.config.mjs の renderer 設定 (alias / define) を vitest 用に再現する。
// ビルドフラグはテストでは全 false (製品版 = base マスタ) で固定。
export default defineConfig({
  resolve: {
    alias: {
      "@renderer": resolve(__dirname, "src/renderer/src"),
      "@core": resolve(__dirname, "src/renderer/src/core"),
      "@app": resolve(__dirname, "src/renderer/src/app"),
      "@platform": resolve(__dirname, "src/renderer/src/platform"),
      "@masterdata": resolve(__dirname, "src/renderer/src/masterdata/base"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify("test"),
    __EDITION__: JSON.stringify("prod"),
    __MASTERDATA_PROFILE__: JSON.stringify("base"),
    __IS_PROD__: "false",
    ...Object.fromEntries(EDITION_FLAG_NAMES.map((name) => [`__IS_${name}__`, "false"])),
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    include: ["test/**/*.test.js"],
  },
});
