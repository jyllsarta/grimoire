#!/usr/bin/env node
// =====================================================================
// 実機テストプレイ (08_verification): headless Chrome を CDP で操作し、実際の DOM をクリックしてゲームを進める。
// コンソールのエラー / Vue warn / 例外を集め、詰まり (同じ状態が続く) を検出する。
//
//   node tools/playtest.js                    タイトルから 1 ラン (既定 600 手)
//   node tools/playtest.js --steps 1500 --runs 2
//   node tools/playtest.js --url http://localhost:5173/
//   node tools/playtest.js --port 9333        CDP のポート (既定 9333)
//   node tools/playtest.js --verbose          1 手ごとの状態を表示
//
// 前提: dev サーバ (npm run dev) が起動している。Chrome は環境変数 CHROME か既定の場所。
// 依存なし (Node 22 の fetch / WebSocket)。エラーがあれば exit 1 と tmp/shots/playtest_err_<n>.png
// =====================================================================
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = {
  url: process.env.VITE_DEV_URL || "http://localhost:5173/",
  steps: 600,
  runs: 1,
  port: 9333,
  verbose: false,
  out: path.join(ROOT, "tmp", "shots"),
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--url") opt.url = args[++i];
  else if (a === "--steps") opt.steps = Number(args[++i]);
  else if (a === "--runs") opt.runs = Number(args[++i]);
  else if (a === "--port") opt.port = Number(args[++i]);
  else if (a === "--out") opt.out = path.resolve(args[++i]);
  else if (a === "--verbose") opt.verbose = true;
  else if (a === "--cheat")
    opt.cheat = true; // debug コマンドで回復 / 通貨を足して、後半の章 / ぬし / 幕間 / あふれ まで到達させる
  else if (a === "--resume") opt.resume = true; // ラン中に一度ページを読み直して つづきから を通す
}
fs.mkdirSync(opt.out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- CDP ----------------
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) for (const fn of this.listeners) fn(msg.method, msg.params);
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(fn) {
    this.listeners.push(fn);
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }
}

async function launch() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "grimoire-playtest-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${opt.port}`,
      `--user-data-dir=${userDir}`,
      "--window-size=1296,815",
      "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let targets = null;
  for (let i = 0; i < 50 && !targets; i++) {
    await sleep(200);
    try {
      targets = await (await fetch(`http://127.0.0.1:${opt.port}/json`)).json();
    } catch {
      /* まだ */
    }
  }
  if (!targets) throw new Error("Chrome の CDP に接続できない");
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
  return { chrome, cdp: new Cdp(ws), userDir };
}

// ---------------- ページ側のヘルパ ----------------
const HELPER = `window.__pt = (() => {
  const pinia = window.app.config.globalProperties.$pinia;
  const store = (n) => pinia._s.get(n);
  const state = () => {
    const run = store("run"), session = store("session");
    const s = run.state;
    return {
      scene: session.scene, dialogs: session.dialogs.map((d) => d.name), loaded: session.loaded,
      phase: run.phase, step: s?.battle?.step ?? null, started: s?.battle?.started ?? null,
      hp: s?.player.hp ?? null, maxHp: null, ending: s?.progress.ending ?? null, chapterIndex: s?.progress.chapterIndex ?? null,
      pending: s?.progress.pending.length ?? 0, coin: s?.wallet.coin ?? null, jewel: s?.wallet.jewel ?? null,
      entities: s?.inventory.entities.length ?? 0, kills: s?.counters.kills ?? 0,
    };
  };
  const click = (sel, idx = 0) => { const els = [...document.querySelectorAll(sel)]; const el = els[idx < 0 ? els.length + idx : idx]; if (!el) return false; el.click(); return true; };
  const count = (sel) => document.querySelectorAll(sel).length;
  const has = (sel) => !!document.querySelector(sel);
  const rightClick = (sel, idx = 0) => { const el = [...document.querySelectorAll(sel)][idx]; if (!el) return false; el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 })); return true; };
  const dispatch = (name, args) => store("run").dispatch(name, args || {});
  return { state, click, count, has, rightClick, dispatch };
})(); true`;

// ---------------- ボット ----------------
function decide(st, mem, pt) {
  // 返り値: { action: 説明, do: async () => {} }
  const top = st.dialogs[st.dialogs.length - 1] ?? null;
  const c = (sel, idx) => pt.eval(`__pt.click(${JSON.stringify(sel)}, ${idx ?? 0})`);
  if (top) {
    switch (top) {
      case "skit":
        return { action: "skit: とばす", do: () => c(".skit_skip") };
      case "difficulty":
        return { action: "difficulty: ノーマル", do: () => c(".diff_btn.normal") };
      case "confirm":
        return { action: "confirm: はい", do: () => c(".confirm_dialog .btn", 0) };
      case "panelPeek":
        if (mem.peekTried) {
          mem.peekTried = false;
          return { action: "peek: すてる", do: () => c(".peek_buttons .btn", 1) };
        }
        mem.peekTried = true;
        return { action: "peek: もらう", do: () => c(".peek_buttons .btn", 0) };
      case "event":
        return { action: "event: 選択肢", do: () => c(".choices .choice:not([disabled])", mem.step % 2 === 0 ? 0 : -1) };
      case "eventResult":
        return { action: "eventResult: とじる", do: () => c(".event_result .peek_buttons .btn", 0) };
      case "organize":
        return {
          action: "organize",
          do: async () => {
            if (await pt.eval(`__pt.has(".shelf_ent")`)) {
              await c(".shelf_ent", 0);
              await sleep(80);
              if (await pt.eval(`__pt.has(".inv_cell.place_ok")`)) {
                await c(".inv_cell.place_ok", 0);
                await sleep(80);
              }
            }
            const ok = await pt.eval(
              `(() => { const b = document.querySelector(".organize_dialog .peek_buttons .btn"); return b && !b.disabled; })()`,
            );
            if (ok) await c(".organize_dialog .peek_buttons .btn", 0);
            else await c(".organize_dialog .peek_buttons .btn", 1); // 受け取らない / やめる
          },
        };
      case "detail":
      case "tips":
        return { action: `${top}: 右クリックで閉じる`, do: () => pt.eval(`__pt.rightClick(".stage")`) };
      default:
        return { action: `${top}: 閉じる`, do: () => c(".peek_buttons .btn", -1) };
    }
  }
  switch (st.scene) {
    case "title":
      if (!mem.titleDialogsDone) {
        mem.titleDialogsDone = true;
        return {
          action: "title: オプション / セーブ管理 / クレジット を開いて閉じる",
          do: async () => {
            for (let i = 0; i < 3; i++) {
              await c(".title_row .btn", i);
              await sleep(200);
              await c(".peek_buttons .btn", -1);
              await sleep(150);
            }
          },
        };
      }
      if (mem.resuming) {
        mem.resuming = false;
        return { action: "title: つづきから", do: () => c(".title_menu .btn.sub") };
      }
      return { action: "title: はじめる", do: () => c(".title_menu .btn.big") };
    case "menu":
      if (!mem.starDone) return { action: "menu: スターパレットへ", do: () => c(".star_btn") };
      return { action: "menu: カード", do: () => c(".char_card") };
    case "bookSelect":
      if (mem.runsDone >= opt.runs) return { action: "done", do: async () => {}, done: true };
      return { action: "bookSelect: はじめる", do: () => c(".book_buttons .btn", 0) };
    case "star":
      if (!mem.starDone) {
        mem.starDone = true;
        return {
          action: "star: 星を ON → プリセット → 全部オフ",
          do: async () => {
            await c(".star_node.avail", 0);
            await sleep(150);
            await c(".star_detail_btn .btn");
            await sleep(150);
            await c(".star_node.active:not(.kind_origin)", 0);
            await sleep(150);
            await c(".star_presets .btn", 0); // イージー → 確認
            await sleep(200);
            await c(".confirm_dialog .btn", 0);
            await sleep(200);
            await c(".star_reset_btn");
            await sleep(200);
            await c(".confirm_dialog .btn", 0);
            await sleep(150);
            await pt.eval(`__pt.rightClick(".star_node")`);
            await sleep(150);
            await pt.eval(`__pt.rightClick(".stage")`);
          },
        };
      }
      return { action: "star: もどる", do: () => c(".back_btn") };
    case "inGame":
      break;
    default:
      return { action: `unknown scene ${st.scene}`, do: () => sleep(200) };
  }
  if (st.phase === "ended") {
    mem.runsDone += 1;
    return { action: "result: 本えらびへ", do: () => c(".result_buttons .btn", -1) };
  }
  if (st.phase === "pending") return { action: "pending: 待ち", do: () => sleep(200) };
  if (opt.resume && !mem.resumed && st.phase === "chapter" && st.kills >= 1) {
    mem.resumed = true;
    mem.resuming = true;
    return { action: "resume: ページを読み直す", do: () => mem.reinit() };
  }
  if (st.phase === "intermission") {
    if (!mem.shopTried) {
      mem.shopTried = true;
      return {
        action: "shop: 買う / 回復 / 引き直し",
        do: async () => {
          if (opt.cheat) {
            await pt.eval(`__pt.dispatch("debug.addJewel", { amount: 20 })`);
            await pt.eval(`__pt.dispatch("debug.addCrown", { amount: 3 })`);
            await sleep(100);
          }
          await c(".shop_card:not(.sold)", 0);
          await sleep(120);
          await c(".shop_card:not(.sold)", -1);
          await sleep(120);
          await c(".heal_btn");
          await sleep(120);
          await c(".shop_foot .btn");
        },
      };
    }
    mem.shopTried = false;
    return { action: "intermission: しゅっぱつ", do: () => c(".go_btn") };
  }
  if (st.phase === "battle") {
    // 勝利は StepMover が自動で閉じる (とじる ボタンは逃走 / 敗北のときだけ)
    if (st.step === "battle.end") return { action: "battle: とじる", do: () => c(".close_btn") };
    if (st.step !== "select") return { action: "battle: 演出待ち", do: () => sleep(250) };
    if (st.hp <= 6 && st.started && mem.step % 3 === 0) return { action: "battle: にげる", do: () => c(".flee_btn") };
    return {
      action: "battle: そうび ON → こうげき",
      do: async () => {
        if (opt.cheat && st.hp < 15) await pt.eval(`__pt.dispatch("debug.healFull")`);
        const n = await pt.eval(`__pt.count(".inv_ent")`);
        for (let i = 0; i < n; i++) {
          await c(".inv_ent", i);
          await sleep(60);
        }
        await c(".attack_btn");
      },
    };
  }
  // chapter
  return {
    action: "chapter: パネル",
    do: async () => {
      if (opt.cheat) {
        if (st.hp < 12) await pt.eval(`__pt.dispatch("debug.healFull")`);
        if (st.coin < 3 && mem.step % 5 === 0) await pt.eval(`__pt.dispatch("debug.addCoin", { amount: 6 })`);
      }
      if (mem.step % 25 === 0) {
        await c(".deck_summary");
        await sleep(150);
        await c(".deck_dialog .peek_buttons .btn");
        await sleep(100);
      }
      if (mem.step % 40 === 20) {
        await pt.eval(`__pt.rightClick(".relic_icon")`);
        await sleep(150);
        await pt.eval(`__pt.rightClick(".stage")`);
        await sleep(100);
      }
      if (mem.step % 33 === 5 && st.entities > 0) {
        await c(".inv_head .btn");
        await sleep(150);
      }
      const order = [
        ".type_chapterClear",
        st.coin > 0 ? ".type_treasure" : null,
        st.hp > 8 ? ".type_enemy" : null,
        ".type_event",
        ".type_treasure",
        ".type_enemy",
      ].filter(Boolean);
      for (const cls of order) if (await c(`.board_row.selectable .panel_card${cls}`, mem.step % 2)) return;
      for (const cls of order) if (await c(`.board_row.selectable .panel_card${cls}`, 0)) return;
    },
  };
}

async function main() {
  const { chrome, cdp, userDir } = await launch();
  const problems = [];
  let lastState = "";
  const noise = (t) => /AudioContext|\[vite\]/.test(t);
  cdp.on((method, p) => {
    if (method === "Runtime.consoleAPICalled" && (p.type === "error" || p.type === "warning")) {
      const text = p.args.map((a) => a.value ?? a.description ?? "").join(" ");
      if (!noise(text)) problems.push({ kind: p.type, text, at: lastState });
    }
    if (method === "Runtime.exceptionThrown")
      problems.push({ kind: "exception", text: p.exceptionDetails.exception?.description || p.exceptionDetails.text, at: lastState });
  });
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  const reinit = async () => {
    await cdp.send("Page.navigate", { url: opt.url });
    for (let i = 0; i < 100; i++) {
      await sleep(200);
      try {
        if (await cdp.eval("!!(window.app && window.app.config.globalProperties.$pinia)")) break;
      } catch {
        /* 読み込み中 */
      }
    }
    await cdp.eval(HELPER);
    for (let i = 0; i < 50; i++) {
      if ((await cdp.eval("__pt.state()")).loaded) break;
      await sleep(100);
    }
  };
  await reinit();

  const mem = { step: 0, runsDone: 0, peekTried: false, shopTried: false, reinit };
  let sameCount = 0;
  let errShots = 0;
  const problemCountBefore = () => problems.length;
  for (mem.step = 1; mem.step <= opt.steps; mem.step++) {
    const st = await cdp.eval("__pt.state()");
    const sig = JSON.stringify(st);
    lastState = `#${mem.step} ${st.scene}/${st.phase}/${st.step ?? "-"} dialogs=[${st.dialogs}] hp=${st.hp} ch=${st.chapterIndex}`;
    if (sig === lastSig(mem, sig)) sameCount++;
    else sameCount = 0;
    if (sameCount >= 40) {
      problems.push({ kind: "stuck", text: `同じ状態が 40 手続いた`, at: lastState });
      break;
    }
    const d = decide(st, mem, cdp);
    if (opt.verbose) console.log(`${lastState} → ${d.action}`);
    if (d.done) break;
    const before = problemCountBefore();
    try {
      await d.do();
    } catch (e) {
      problems.push({ kind: "driver", text: e.message, at: lastState });
    }
    await sleep(st.phase === "battle" ? 350 : 220);
    if (problems.length > before && errShots < 8) {
      errShots++;
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      const file = path.join(opt.out, `playtest_err_${errShots}.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
      problems[problems.length - 1].shot = file;
    }
  }
  const final = await cdp.eval("__pt.state()");
  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(opt.out, "playtest_last.png"), Buffer.from(shot.data, "base64"));
  chrome.kill();
  try {
    fs.rmSync(userDir, { recursive: true, force: true });
  } catch {
    /* Chrome が握っていることがある */
  }
  console.log(`手数 ${mem.step - 1} / ラン完了 ${mem.runsDone} / 最終 ${JSON.stringify(final)}`);
  if (problems.length) {
    console.log(`問題 ${problems.length} 件:`);
    for (const p of problems.slice(0, 40))
      console.log(`- [${p.kind}] ${p.text.split("\n").slice(0, 3).join(" | ")}\n    at ${p.at}${p.shot ? `\n    shot ${p.shot}` : ""}`);
    process.exit(1);
  }
  console.log("問題なし");
}

function lastSig(mem, sig) {
  const prev = mem.lastSig;
  mem.lastSig = sig;
  return prev;
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
