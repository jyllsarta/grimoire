// `npm run <name>` を OS ごとの `<name>:win` / `<name>:mac` に振り分ける (環境変数の書き方が違うため)
const { spawnSync } = require("node:child_process");

const baseScriptName = process.argv[2];

if (!baseScriptName) {
  console.error("Missing npm script name.");
  process.exit(1);
}

const platformSuffix = process.platform === "win32" ? "win" : "mac";
const scriptName = `${baseScriptName}:${platformSuffix}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(npmCommand, ["run", scriptName], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
