import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import tables from "@masterdata/index.js";
import { loadMaster } from "@core/master/index.js";
import "./app/styles/global.scss";

if (!__IS_PROD__) {
  await import("./app/dev/consoleBuffer.js");
}

if (__IS_ANDROID__) {
  document.documentElement.classList.add("is-android");
}

// マスタは起動時に 1 回注入する (core は @masterdata を直接 import しない)
loadMaster(tables);

const app = createApp(App);
app.use(createPinia());
app.mount("#window");

// ドラッグ操作の既定動作 (画像のドラッグ等) を止める
for (const eventName of ["dragstart", "dragenter", "dragover", "drop"]) {
  document.addEventListener(eventName, (event) => event.preventDefault(), { capture: true, passive: false });
}

if (!__IS_PROD__) {
  window.app = app;
}
