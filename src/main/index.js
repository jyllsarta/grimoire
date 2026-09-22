import { app, shell, BrowserWindow, ipcMain, screen } from "electron";
import { join, dirname } from "path";
import fs from "fs";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";

if (process.env.REMOTE_DEBUGGING_PORT) {
  app.commandLine.appendSwitch("remote-debugging-port", process.env.REMOTE_DEBUGGING_PORT);
}

// ---------------------------------------------------------------
// セーブファイル (06_save)
//   実行ファイルの隣の save/ (ポータブル運用)。開発中はリポジトリ直下の save/。
//   書き込みは一時ファイル → rename の原子更新、直前版を .bak に残す。
// ---------------------------------------------------------------
const SAVE_FILE_NAME = /^[a-z0-9_]+$/;

function saveDir() {
  const base = app.isPackaged ? dirname(process.execPath) : process.cwd();
  return join(base, "save");
}

function saveFilePath(name) {
  if (typeof name !== "string" || !SAVE_FILE_NAME.test(name)) {
    throw new Error(`invalid save file name: ${name}`);
  }
  return join(saveDir(), `${name}.json`);
}

function loadSaveFile(name) {
  const file = saveFilePath(name);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

function writeSaveFile(name, content) {
  const file = saveFilePath(name);
  fs.mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, typeof content === "string" ? content : JSON.stringify(content), "utf8");
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
  fs.renameSync(tmp, file);
  return true;
}

function removeSaveFile(name) {
  const file = saveFilePath(name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
}

ipcMain.handle("save:load", (_, name) => loadSaveFile(name));
ipcMain.handle("save:write", (_, name, content) => writeSaveFile(name, content));
ipcMain.handle("save:remove", (_, name) => removeSaveFile(name));

// ---------------------------------------------------------------
// ウィンドウ (01: 1280x720、最小 1280x720 (content size)、F11 全画面、状態記憶)
// ---------------------------------------------------------------
function createWindow() {
  const mainWindow = new BrowserWindow({
    useContentSize: true,
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("before-input-event", (_, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  ipcMain.on("set-fullscreen", (_, value) => {
    mainWindow.setFullScreen(!!value);
  });

  ipcMain.on("set-window-size", (_, width, height) => {
    // 前回のサイズをそのまま当てると別解像度のモニタで画面外にはみ出すので、ワークエリアに収めて中央寄せする
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = display.workArea;
    const clampedWidth = Math.min(width, areaWidth);
    const clampedHeight = Math.min(height, areaHeight);
    mainWindow.setBounds({
      x: areaX + Math.round((areaWidth - clampedWidth) / 2),
      y: areaY + Math.round((areaHeight - clampedHeight) / 2),
      width: clampedWidth,
      height: clampedHeight,
    });
  });

  ipcMain.on("maximize-window", () => {
    mainWindow.maximize();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  let windowStateNotifyTimer = null;
  const notifyWindowState = () => {
    clearTimeout(windowStateNotifyTimer);
    windowStateNotifyTimer = setTimeout(() => {
      if (mainWindow.isDestroyed()) return;
      const { width, height } = mainWindow.getBounds();
      mainWindow.webContents.send("window-state-changed", {
        width,
        height,
        fullscreen: mainWindow.isFullScreen(),
        maximized: mainWindow.isMaximized(),
      });
    }, 500);
  };
  mainWindow.on("resize", notifyWindowState);
  mainWindow.on("maximize", notifyWindowState);
  mainWindow.on("unmaximize", notifyWindowState);
  mainWindow.on("enter-full-screen", notifyWindowState);
  mainWindow.on("leave-full-screen", notifyWindowState);

  // 外部リンクは OS のブラウザへ
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("net.jyllsarta.grimoire");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
