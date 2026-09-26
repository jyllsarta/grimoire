// ============================================================
// session ストア: scene / dialogs / options / language / 進行データ (06 progress) の読み書き
// ============================================================
import { defineStore } from "pinia";
import { createDefaultStorage } from "@platform/storage.js";
import { edition } from "@platform/edition.js";

export const PROGRESS_SCHEMA_VERSION = 1;

export function initialProgress(now = Date.now()) {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    meta: { createdAt: now, updatedAt: now, appVersion: edition.version, playTimeMs: 0 },
    flags: { sawOpening: false, difficultyChosen: false },
    options: { bgmVolume: 0.7, seVolume: 0.7, masterVolume: 0.4, lightWeightMode: edition.isAndroid, fastBattle: false, muteOnBlur: false },
    language: "ja_jp",
    characters: {},
    achievements: {},
  };
}

export function defaultCharacterProgress() {
  return { star: { activeNodeIds: [], lastPreset: null }, totalCrowns: 0, records: {}, skitsRead: {}, misfortunesSeen: {} };
}

export function defaultRecord() {
  return { tries: 0, normalEnds: 0, happyEnds: 0, losses: 0, bestDelta: null, bestHappyDelta: null };
}

// テンプレートとの型比較で欠けたキーを埋める (xqueens Savedata.migrate 相当)
export function migrateProgress(saved) {
  const tpl = initialProgress();
  const fill = (dst, src) => {
    for (const k of Object.keys(src)) {
      if (dst[k] === undefined || dst[k] === null) dst[k] = src[k];
      else if (typeof src[k] === "object" && !Array.isArray(src[k]) && typeof dst[k] === "object") fill(dst[k], src[k]);
    }
    return dst;
  };
  const out = fill(saved, tpl);
  for (const c of Object.values(out.characters)) fill(c, defaultCharacterProgress());
  out.schemaVersion = PROGRESS_SCHEMA_VERSION;
  return out;
}

let storage = null;
export function setStorage(s) {
  storage = s;
}
function store() {
  return (storage ||= createDefaultStorage());
}

let dialogUid = 1;

export const useSessionStore = defineStore("session", {
  state: () => ({
    scene: "title",
    sceneParams: {},
    // 開いているダイアログのスタック (後に開いたものが手前)。{ id, name, params, resolve }
    dialogs: [],
    progress: initialProgress(),
    hasRunSave: false,
    loaded: false,
    fullscreen: false,
    bgm: null,
  }),
  getters: {
    options: (s) => s.progress.options,
    language: (s) => s.progress.language,
    speed: (s) => (s.progress.options.fastBattle ? 0.4 : 1),
    topDialog: (s) => s.dialogs[s.dialogs.length - 1] ?? null,
  },
  actions: {
    setScene(scene, params = {}) {
      this.scene = scene;
      this.sceneParams = params;
    },
    // ダイアログを開く。閉じるときの値で解決する Promise を返す (スキットの終了待ちなどに使う)
    openDialog(name, params = {}) {
      let resolve = null;
      const promise = new Promise((r) => (resolve = r));
      this.dialogs.push({ id: dialogUid++, name, params, resolve });
      return promise;
    },
    closeDialog(idOrName, result = null) {
      const i =
        typeof idOrName === "number" ? this.dialogs.findIndex((d) => d.id === idOrName) : this.dialogs.map((d) => d.name).lastIndexOf(idOrName);
      if (i < 0) return;
      const [d] = this.dialogs.splice(i, 1);
      d.resolve?.(result);
    },
    closeAllDialogs() {
      for (const d of this.dialogs.splice(0)) d.resolve?.(null);
    },
    isDialogOpen(name) {
      return this.dialogs.some((d) => d.name === name);
    },
    setBgm(key) {
      this.bgm = key;
    },
    async load() {
      const json = await store().load("progress");
      if (json) {
        try {
          this.progress = migrateProgress(JSON.parse(json));
        } catch (e) {
          console.warn("progress.json が読めない。初期化する", e);
          this.progress = initialProgress();
        }
      }
      this.hasRunSave = !!(await store().load("run"));
      this.loaded = true;
    },
    async save() {
      this.progress.meta.updatedAt = Date.now();
      await store().save("progress", JSON.stringify(this.progress));
    },
    async reset() {
      this.progress = initialProgress();
      await this.save();
      await store().remove("run");
      this.hasRunSave = false;
    },
    async setOptions(patch) {
      Object.assign(this.progress.options, patch);
      await this.save();
    },
    characterProgress(characterId) {
      return (this.progress.characters[characterId] ||= defaultCharacterProgress());
    },
    record(characterId, bookId) {
      const c = this.characterProgress(characterId);
      return (c.records[bookId] ||= defaultRecord());
    },
    // 戦績 (06): tries はラン開始時、endings は ending 確定時
    async recordTry(characterId, bookId) {
      this.record(characterId, bookId).tries += 1;
      await this.save();
    },
    async recordEnding(state) {
      const rec = this.record(state.characterId, state.bookId);
      const c = this.characterProgress(state.characterId);
      const delta = state.star.delta;
      switch (state.progress.ending) {
        case "normal":
          rec.normalEnds += 1;
          rec.bestDelta = rec.bestDelta == null ? delta : Math.min(rec.bestDelta, delta);
          break;
        case "happy":
          rec.happyEnds += 1;
          rec.bestDelta = rec.bestDelta == null ? delta : Math.min(rec.bestDelta, delta);
          rec.bestHappyDelta = rec.bestHappyDelta == null ? delta : Math.min(rec.bestHappyDelta, delta);
          break;
        case "lose":
          rec.losses += 1;
          // Extra での敗北は本編完走も残す
          if (state.progress.stage === "extra") rec.normalEnds += 1;
          break;
        default:
          break;
      }
      if (state.progress.ending !== "abandoned") c.totalCrowns += state.star.crownsGained;
      await this.save();
      await store().remove("run");
      this.hasRunSave = false;
    },
    // スターパレット (06 progress.characters[cid].star)
    async setActiveNodeIds(characterId, ids, preset = null) {
      const c = this.characterProgress(characterId);
      c.star.activeNodeIds = [...ids];
      if (preset !== undefined) c.star.lastPreset = preset;
      await this.save();
    },
    async markSkitRead(characterId, skitId) {
      this.characterProgress(characterId).skitsRead[skitId] = true;
      await this.save();
    },
    async markMisfortuneSeen(characterId, eventId) {
      this.characterProgress(characterId).misfortunesSeen[eventId] = true;
      await this.save();
    },
    async setFlag(name, value = true) {
      this.progress.flags[name] = value;
      await this.save();
    },
    // ランのオートセーブ (06): コマンド成功のたび
    async saveRun(json) {
      await store().save("run", json);
      this.hasRunSave = true;
    },
    async loadRun() {
      return store().load("run");
    },
    async removeRun() {
      await store().remove("run");
      this.hasRunSave = false;
    },
  },
});
