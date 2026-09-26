// ============================================================
// URL ハッシュ直行 (01「開発ビルド限定」、07「開発用ハッシュ直行」)。固定シードのコマンド列で状態を作るのでスクショが安定する。
//   #title #menu #bookselect #star #ingame #baloon #battle #badbattle #peek #event #organize #intermission #result #skit #starclear #autotest
// ============================================================
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { useInspectorStore } from "../stores/inspector.js";
import { useTalkStore } from "../stores/talk.js";
import { panelAt, phaseOf } from "@core/queries/index.js";
import { master } from "@core/master/index.js";
import { runUntil } from "../../../../../test/harness/run_until.js";
import { autoPlay } from "../../../../../test/harness/auto_play.js";
import { getConsoleLogs } from "./consoleBuffer.js";

const SEED = 1;

function startRun(seed = SEED) {
  const run = useRunStore();
  const session = useSessionStore();
  run.start({ characterId: 1, bookId: 1, seed });
  session.setScene("inGame");
  return run;
}

// 下段から kind のパネルを探す。無ければ null
function findCell(state, kind) {
  for (let c = 0; c < state.board.width; c++) if (panelAt(state, c)?.kind === kind) return c;
  return null;
}

// 下段の敵を探して戦闘に入る (いなければ敵以外を捨てて落とす)。select まで進めて返す
function enterBattle(run) {
  for (let guard = 0; guard < 30; guard++) {
    const s = run.state;
    const enemyCell = findCell(s, "enemy");
    if (enemyCell != null) {
      run.dispatch("startBattle", { cell: enemyCell });
      runUntil(s);
      return true;
    }
    const c = [...Array(s.board.width).keys()].find((i) => panelAt(s, i) && panelAt(s, i).kind !== "chapterClear");
    if (c == null) return false;
    const p = panelAt(s, c);
    if (p.kind === "event") run.dispatch("chooseEvent", { cell: c, choiceIndex: 0 });
    else run.dispatch("dumpPanel", { cell: c });
  }
  return false;
}

// 下段に kind のパネルが来るまで、他を捨てる
function bringToFront(run, kind) {
  for (let guard = 0; guard < 30; guard++) {
    const s = run.state;
    const c = findCell(s, kind);
    if (c != null) return c;
    const other = [...Array(s.board.width).keys()].find((i) => panelAt(s, i) && !["chapterClear", "enemy", kind].includes(panelAt(s, i).kind));
    if (other == null) return null;
    const p = panelAt(s, other);
    if (p.kind === "event") run.dispatch("chooseEvent", { cell: other, choiceIndex: 0 });
    else run.dispatch("dumpPanel", { cell: other });
  }
  return null;
}

export const SCENARIOS = {
  title: () => useSessionStore().setScene("title"),
  menu: () => useSessionStore().setScene("menu"),
  bookselect: () => useSessionStore().setScene("bookSelect", { characterId: 1 }),
  star: () => useSessionStore().setScene("star", { characterId: 1, back: "menu" }),
  ingame: () => startRun(),
  // 吹き出しを出しっぱなしにする (talk.say はタイマーで消えるので、直接 message を置く)
  baloon: () => {
    startRun();
    const talk = useTalkStore();
    talk.message = "…新しいページです。気を抜かないで。";
    talk.updatedAt = Date.now();
  },
  battle: () => enterBattle(startRun()),
  badbattle: () => {
    const run = startRun();
    enterBattle(run);
    run.dispatch("debug.applyStatus", { key: "poison", value: 3 });
    run.dispatch("debug.applyStatus", { key: "sleep", value: 1 });
    run.dispatch("debug.applyStatus", { key: "arousal", value: 5 });
    run.dispatch("debug.applyStatus", { key: "sticky", value: 3 });
    run.dispatch("debug.applyStatus", { key: "ds_crystal", value: 2 });
    run.dispatch("debug.setCostume", { key: "half" });
  },
  // 勝利直後 (パネルが盤面から消えた状態で battle.end)。戦闘レイヤーが出てから勝つ = 実プレイと同じ経路。
  // 勝利は StepMover が VICTORY_CLOSE_MS 後に自動で閉じるので、スクショはその前に撮る (--budget を短く)
  victory: () => {
    const run = startRun();
    enterBattle(run);
    setTimeout(() => {
      run.dispatch("debug.winBattle", {});
      runUntil(run.state);
    }, 1500);
  },
  // 同じ状態にセーブから復帰した形 (レイヤーが敵パネルを見たことがない)
  victoryresume: () => {
    const run = startRun();
    enterBattle(run);
    run.dispatch("debug.winBattle", {});
    runUntil(run.state);
  },
  peek: () => {
    const run = startRun();
    const c = bringToFront(run, "equipment") ?? bringToFront(run, "item");
    if (c != null) useSessionStore().openDialog("panelPeek", { cell: c });
  },
  event: () => {
    const run = startRun(3);
    const c = bringToFront(run, "event");
    if (c != null) useSessionStore().openDialog("event", { cell: c });
  },
  organize: () => {
    startRun();
    useSessionStore().openDialog("organize", { mode: "plain" });
  },
  intermission: () => {
    const run = startRun();
    run.dispatch("debug.addJewel", { amount: 12 });
    run.dispatch("debug.addCrown", { amount: 2 });
    run.dispatch("debug.clearChapter", {});
  },
  result: () => {
    const run = startRun();
    run.dispatch("giveUp", {});
  },
  skit: () => {
    useSessionStore().setScene("menu");
    const skit = master.all("skits").find((s) => s.trigger === "bookStart");
    if (skit) useSessionStore().openDialog("skit", { skitId: skit.id });
  },
  starclear: async () => {
    await useSessionStore().reset();
    useSessionStore().setScene("title");
  },
  // 実クリックではなく run.dispatch 経由でボットを回し、結果を DOM に書く (tools/shot.js --autotest が回収する)
  autotest: () => {
    const run = startRun(7);
    const errorsBefore = getConsoleLogs(["error", "warn"]).length;
    const result = autoPlay(run.state, { seed: 7, onCommand: () => {} });
    const logs = getConsoleLogs(["error", "warn"]).slice(errorsBefore);
    const summary = {
      ended: result.ended,
      ending: result.ending,
      steps: result.steps,
      phase: phaseOf(run.state),
      errors: logs.map((l) => l.args.join(" ")),
    };
    const el = document.createElement("pre");
    el.id = "autotest_result";
    el.textContent = `AUTOTEST_RESULT ${JSON.stringify(summary)}`;
    document.body.appendChild(el);
    run.setState(run.state);
  },
};

// `#battle,inspector` のようにカンマ区切りで追加フラグを付けられる (inspector = インスペクタを開いた状態で撮る)
export async function runScenarioFromHash(hash) {
  const [name, ...flags] = (hash || "").replace(/^#/, "").split(",");
  if (!name) return false;
  const fn = SCENARIOS[name];
  if (!fn) {
    console.warn(`unknown scenario: #${name}`);
    return false;
  }
  await fn();
  if (flags.includes("inspector")) useInspectorStore().open = true;
  return true;
}
