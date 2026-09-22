import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
}

// renderer が使う API は platform/ のアダプタ経由でだけ触る (06_save: storage.js、01: window)
contextBridge.exposeInMainWorld("electronAPI", {
  // セーブファイル (main 側で save/<name>.json を原子更新する)
  loadSave: (name) => ipcRenderer.invoke("save:load", name),
  writeSave: (name, content) => ipcRenderer.invoke("save:write", name, content),
  removeSave: (name) => ipcRenderer.invoke("save:remove", name),

  // ウィンドウ
  setFullscreen: (value) => ipcRenderer.send("set-fullscreen", value),
  setWindowSize: (width, height) => ipcRenderer.send("set-window-size", width, height),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  quitApp: () => ipcRenderer.send("quit-app"),
  onWindowStateChanged: (callback) => {
    ipcRenderer.on("window-state-changed", (_, state) => callback(state));
  },
});
