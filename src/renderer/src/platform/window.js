// Electron ウィンドウの状態記憶 (xqueens GameWindow.vue の restoreWindowState)。Web では何もしない
import { isElectron } from "./edition.js";

const KEY = "grimoire_window_state";

export function restoreWindowState(onChange = null) {
  if (!isElectron) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (state.fullscreen) window.electronAPI.setFullscreen(true);
      else if (state.maximized) window.electronAPI.maximizeWindow();
      else if (state.width && state.height) window.electronAPI.setWindowSize(state.width, state.height);
    }
  } catch (e) {
    console.warn(e);
  }
  window.electronAPI.onWindowStateChanged((state) => {
    localStorage.setItem(KEY, JSON.stringify(state));
    onChange?.(state);
  });
}

export function setFullscreen(value) {
  if (isElectron) window.electronAPI.setFullscreen(value);
}

export function quitApp() {
  if (isElectron) window.electronAPI.quitApp();
}
