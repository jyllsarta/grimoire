import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import pkg from "./package.json";
import { prepareEditionPublicDir } from "./scripts/prepare-edition-public-assets.mjs";
import { writeEditionMarker } from "./scripts/edition-marker.mjs";
import { resolveEditionFlags, resolveMasterdataProfile } from "./config/editions.mjs";

/**
 * =========================
 * ビルドフラグ (エディションは環境変数 EDITION 1 本。詳細は config/editions.mjs)
 * =========================
 */
const EDITION = process.env.EDITION || "prod";
const BUILD_FLAGS = {
  ...resolveEditionFlags(EDITION),
  PROD: process.env.NODE_ENV === "production",
};
const flagEntries = Object.entries(BUILD_FLAGS).map(([k, v]) => [k.toLowerCase(), v]);
const rendererPublicDir = prepareEditionPublicDir({ projectRoot: __dirname, buildFlags: BUILD_FLAGS });
writeEditionMarker({ projectRoot: __dirname, edition: EDITION, buildFlags: BUILD_FLAGS });
const webOutDir = resolve(__dirname, "dist/web");

// data-if-xxx / data-else-xxx を持つ要素をビルド時に AST から落とす
function shouldRemoveNode(attrName, flags) {
  const [, type, key] = attrName.match(/^data-(if|else)-(.+)$/) || [];
  if (!type || !(key in flags)) return false;
  const flagValue = flags[key];
  return type === "if" ? !flagValue : flagValue;
}

// マスタは profile 別に生成済み (tools/import.js)。@masterdata alias がそのディレクトリを指す
const masterdataProfile = resolveMasterdataProfile(BUILD_FLAGS);
const masterdataDir = resolve(__dirname, "src/renderer/src/masterdata", masterdataProfile);

// 健全版は「何を削ったか」を書いたコメントを成果物に載せないため 3 プロセスとも minify する
const CLEAN_MINIFY_BUILD = BUILD_FLAGS.CLEAN ? { minify: "esbuild" } : {};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { ...CLEAN_MINIFY_BUILD },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { ...CLEAN_MINIFY_BUILD },
  },
  renderer: {
    publicDir: rendererPublicDir,
    base: BUILD_FLAGS.WEB ? "./" : "/",
    build: {
      ...(BUILD_FLAGS.WEB ? { outDir: webOutDir, emptyOutDir: true } : {}),
      ...CLEAN_MINIFY_BUILD,
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __EDITION__: JSON.stringify(EDITION),
      __MASTERDATA_PROFILE__: JSON.stringify(masterdataProfile),
      ...Object.fromEntries(Object.entries(BUILD_FLAGS).map(([k, v]) => [`__IS_${k}__`, JSON.stringify(v)])),
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@core": resolve("src/renderer/src/core"),
        "@app": resolve("src/renderer/src/app"),
        "@platform": resolve("src/renderer/src/platform"),
        "@masterdata": masterdataDir,
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // JS 側の __IS_CLEAN__ に相当する定数を Sass 側にも用意する
          additionalData: `$is-clean: ${BUILD_FLAGS.CLEAN};`,
        },
      },
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            nodeTransforms: [
              (node, context) => {
                if (node.type !== 1 /* ELEMENT */) return;
                const flags = Object.fromEntries(flagEntries);
                const removableAttrs = node.props.filter((p) => p.type === 6 && (p.name.startsWith("data-if-") || p.name.startsWith("data-else-")));
                if (removableAttrs.some((p) => shouldRemoveNode(p.name, flags))) {
                  // コメントノードに置き換えず、ノードごと AST から取り除く (健全版に痕跡を残さない)
                  context.removeNode();
                  return;
                }
                node.props = node.props.filter((p) => !(p.type === 6 && (p.name.startsWith("data-if-") || p.name.startsWith("data-else-"))));
              },
            ],
          },
        },
      }),
      {
        // Android WebView は動的に追加した meta[name=viewport] を初回レイアウトに反映しないため、ビルド出力に直接埋め込む
        name: "grimoire-android-viewport-meta",
        transformIndexHtml(html) {
          if (!BUILD_FLAGS.ANDROID) return html;
          return html.replace("<head>", `<head>\n    <meta name="viewport" content="width=1280, viewport-fit=cover" />`);
        },
      },
    ],
  },
});
