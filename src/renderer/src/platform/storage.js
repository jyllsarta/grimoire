// ============================================================
// 保存先アダプタ (06_save)。load(name) / save(name, json) / remove(name) の 3 つに閉じる。
//   Electron: 実行ファイルの隣の save/<name>.json (main が原子更新 + .bak)
//   Web / Android: localStorage。キー grimoire_<edition group>_<name>
// テストは createMemoryStorage() に差し替える。
// ============================================================
import { saveGroup, isElectron } from "./edition.js";

export function createElectronStorage() {
  const api = window.electronAPI;
  return {
    kind: "electron",
    async load(name) {
      return (await api.loadSave(name)) ?? null;
    },
    async save(name, json) {
      await api.writeSave(name, typeof json === "string" ? json : JSON.stringify(json));
    },
    async remove(name) {
      await api.removeSave(name);
    },
  };
}

export function createLocalStorage(group = saveGroup()) {
  const key = (name) => `grimoire_${group}_${name}`;
  return {
    kind: "localStorage",
    async load(name) {
      return localStorage.getItem(key(name));
    },
    async save(name, json) {
      localStorage.setItem(key(name), typeof json === "string" ? json : JSON.stringify(json));
    },
    async remove(name) {
      localStorage.removeItem(key(name));
    },
  };
}

export function createMemoryStorage() {
  const map = new Map();
  return {
    kind: "memory",
    async load(name) {
      return map.get(name) ?? null;
    },
    async save(name, json) {
      map.set(name, typeof json === "string" ? json : JSON.stringify(json));
    },
    async remove(name) {
      map.delete(name);
    },
  };
}

export function createDefaultStorage() {
  return isElectron ? createElectronStorage() : createLocalStorage();
}
