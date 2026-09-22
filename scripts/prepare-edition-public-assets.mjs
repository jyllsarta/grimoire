import fs from "node:fs";
import path from "node:path";

import { EDITION_ASSET_BLACKLIST, EDITION_ASSET_OVERLAY_EDITIONS } from "../config/edition-asset-blacklist.mjs";

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function escapeRegex(source) {
  return source.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

export function globToRegExp(pattern) {
  const normalized = toPosixPath(pattern).replace(/^\/+/, "");
  const escaped = escapeRegex(normalized)
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function validateBlacklistConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("EDITION_ASSET_BLACKLIST must be an object.");
  }
  for (const [key, value] of Object.entries(config)) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      throw new Error(`EDITION_ASSET_BLACKLIST.${key} must be an array of strings.`);
    }
    if (value.some((item) => item === "!")) {
      throw new Error(`EDITION_ASSET_BLACKLIST.${key} に "!" のみの空パターンがあります。`);
    }
  }
}

function getEditionProfile(buildFlags, blacklistConfig) {
  const activeKeys = [];
  if (buildFlags.CIEN) activeKeys.push("cien");
  if (buildFlags.TRIAL) activeKeys.push("trial");
  if (buildFlags.CLEAN) activeKeys.push("clean");

  if (activeKeys.length === 0) {
    return { name: "default", patterns: [], activeKeys };
  }

  const combinedKeys = [];
  if (buildFlags.CIEN && buildFlags.TRIAL) combinedKeys.push("cienTrial");

  const patterns = [
    ...(blacklistConfig.common ?? []),
    ...activeKeys.flatMap((key) => blacklistConfig[key] ?? []),
    ...combinedKeys.flatMap((key) => blacklistConfig[key] ?? []),
  ];

  return { name: [...activeKeys].sort().join("-"), patterns, activeKeys };
}

// ディレクトリは除外判定をせず常に再帰し、除外 / 許可の判定はファイル単位でのみ行う
// (「grimoire_scenes/** を除外しつつ !grimoire_scenes/scene301_* だけ残す」を成立させるため)。
function copyFilteredTree(sourceDir, destinationDir, context) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const relativePath = toPosixPath(path.relative(context.sourcePublicDir, sourcePath));
    const destinationPath = path.join(destinationDir, entry.name);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyFilteredTree(sourcePath, destinationPath, context);
      continue;
    }
    if (stat.isFile()) {
      const matchesExclude = context.excludeMatchers.some((matcher) => matcher.test(relativePath));
      const matchesKeep = context.keepMatchers.some((matcher) => matcher.test(relativePath));
      if (matchesExclude && !matchesKeep) {
        context.excludedCount += 1;
        continue;
      }
      if (matchesExclude && matchesKeep) context.keptByWhitelistCount += 1;
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
      context.copiedFileCount += 1;
      continue;
    }
    throw new Error(`Unsupported asset entry type: ${sourcePath}`);
  }
}

// オーバーレイはブラックリストより優先 (除外判定を一切通さない無条件コピー)
function copyOverlayTree(sourceDir, destinationDir) {
  let copiedCount = 0;
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      copiedCount += copyOverlayTree(sourcePath, destinationPath);
      continue;
    }
    if (stat.isFile()) {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
      copiedCount += 1;
      continue;
    }
    throw new Error(`Unsupported overlay asset entry type: ${sourcePath}`);
  }
  return copiedCount;
}

export function prepareEditionPublicDir({
  projectRoot,
  buildFlags,
  blacklistConfig = EDITION_ASSET_BLACKLIST,
  overlayEditions = EDITION_ASSET_OVERLAY_EDITIONS,
}) {
  validateBlacklistConfig(blacklistConfig);

  const sourcePublicDir = path.resolve(projectRoot, "src/renderer/public");
  const profile = getEditionProfile(buildFlags, blacklistConfig);
  const overlayKeys = profile.activeKeys.filter((key) => overlayEditions.includes(key));

  // blacklist もオーバーレイも無いエディションは高速パス (コピーなし)
  if (profile.patterns.length === 0 && overlayKeys.length === 0) {
    return sourcePublicDir;
  }

  const destinationRoot = path.resolve(projectRoot, ".generated/edition-public");
  const destinationDir = path.join(destinationRoot, profile.name);

  const positivePatterns = profile.patterns.filter((pattern) => !pattern.startsWith("!"));
  const negativePatterns = profile.patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => pattern.slice(1));

  const context = {
    sourcePublicDir,
    excludeMatchers: positivePatterns.map(globToRegExp),
    keepMatchers: negativePatterns.map(globToRegExp),
    excludedCount: 0,
    keptByWhitelistCount: 0,
    copiedFileCount: 0,
  };

  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(destinationDir, { recursive: true });
  copyFilteredTree(sourcePublicDir, destinationDir, context);

  console.log(
    `[edition-assets] profile=${profile.name} excluded=${context.excludedCount} keptByWhitelist=${context.keptByWhitelistCount} copiedFiles=${context.copiedFileCount}`,
  );

  for (const key of overlayKeys) {
    const overlayDir = path.resolve(projectRoot, "src/renderer/overlay_assets", key);
    if (!fs.existsSync(overlayDir)) {
      // grimoire では健全版のオーバーレイ素材はまだ無い。無ければ警告だけ出して素通しする
      // (xqueens は例外にしていたが、M1 では素材が揃っていないため)。
      console.warn(`[edition-assets] overlay=${key} のディレクトリが無いのでスキップ: ${overlayDir}`);
      continue;
    }
    const overlayFileCount = copyOverlayTree(overlayDir, destinationDir);
    console.log(`[edition-assets] overlay=${key} files=${overlayFileCount}`);
  }

  return destinationDir;
}
