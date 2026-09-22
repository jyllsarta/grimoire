import eslintConfig from "@electron-toolkit/eslint-config";
import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import { EDITION_FLAG_NAMES } from "./config/editions.mjs";

// Vue から state へ直接代入する形を機械的に捕まえる (01「書くのは dispatch だけ」)。
// `state.x = ...` / `run.state.x = ...` / `x.state.y = ...` と、その ++ / -- を対象にする。
const STATE_WRITE_SELECTORS = [
  "AssignmentExpression > MemberExpression.left[object.name='state']",
  "AssignmentExpression > MemberExpression.left[object.property.name='state']",
  "AssignmentExpression > MemberExpression.left[object.object.name='state']",
  "AssignmentExpression > MemberExpression.left[object.object.property.name='state']",
  "UpdateExpression > MemberExpression.argument[object.name='state']",
  "UpdateExpression > MemberExpression.argument[object.property.name='state']",
].map((selector) => ({ selector, message: "Vue から state に書き込まない。run store の dispatch を使う (no-state-write)" }));

export default [
  {
    ignores: ["**/node_modules", "**/dist", "**/out", ".generated", "tmp", "save", "src/renderer/src/masterdata/**"],
  },
  eslintConfig,
  ...eslintPluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        extraFileExtensions: [".vue"],
      },
    },
  },
  eslintConfigPrettier,
  {
    files: ["**/*.{js,mjs,cjs,jsx,vue}"],
    languageOptions: {
      globals: {
        __APP_VERSION__: "readonly",
        __EDITION__: "readonly",
        __MASTERDATA_PROFILE__: "readonly",
        __IS_PROD__: "readonly",
        ...Object.fromEntries(EDITION_FLAG_NAMES.map((name) => [`__IS_${name}__`, "readonly"])),
      },
    },
    rules: {
      "vue/require-default-prop": "off",
      "vue/multi-word-component-names": "off",
      "no-unused-vars": "off",
      "linebreak-style": "off",
      "no-irregular-whitespace": "off",
      "vue/valid-template-root": "off",
    },
  },
  {
    // core は純 JS。Vue / DOM / Electron / app / platform を import したら落とす。乱数は state.rng だけ
    files: ["src/renderer/src/core/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["vue", "pinia", "electron", "gsap"],
          patterns: [
            { group: ["**/app/**", "@app/*", "@renderer/app/*"], message: "core から app を参照しない (01 依存の向き)" },
            { group: ["**/platform/**", "@platform/*", "@renderer/platform/*"], message: "core から platform を参照しない (01 依存の向き)" },
          ],
        },
      ],
      "no-restricted-properties": ["error", { object: "Math", property: "random", message: "core では state.rng を使う (Math.random 禁止)" }],
      "no-restricted-globals": ["error", "window", "document", "localStorage", "navigator"],
    },
  },
  {
    files: ["src/renderer/src/app/**/*.{js,vue}"],
    rules: {
      "no-restricted-syntax": ["error", ...STATE_WRITE_SELECTORS],
    },
  },
  {
    files: ["test/**/*.js", "tools/**/*.js"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
];
