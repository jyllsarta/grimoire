// ============================================================
// URL ハッシュ直行 (01「開発ビルド限定」、07「開発用ハッシュ直行」)。固定シードのコマンド列で状態を作るのでスクショが安定する。
//   #title #menu #ingame #battle #badbattle #intermission #result #starclear #autotest
// ============================================================
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { useInspectorStore } from "../stores/inspector.js";
import { panelAt, phaseOf } from "@core/queries/index.js";
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

// 下段の敵を探して戦闘に入る (いなければ敵以外を捨てて落とす)。select まで進めて返す
function enterBattle(run) {
  for (let guard = 0; guard < 30; guard++) {
    const s = run.state;
    for (let c = 0; c < s.board.width; c++) {
      if (panelAt(s, c)?.kind === "enemy") {
        run.dispatch("startBattle", { cell: c });
        runUntil(s);
        return true;
      }
    }
    const c = [...Array(s.board.width).keys()].find((i) => panelAt(s, i) && panelAt(s, i).kind !== "chapterClear");
    if (c == null) return false;
    const p = panelAt(s, c);
    if (p.kind === "event") run.dispatch("chooseEvent", { cell: c, choiceIndex: 0 });
    else run.dispatch("dumpPanel", { cell: c });
  }
  return false;
}

export const SCENARIOS = {
  title: () => useSessionStore().setScene("title"),
  menu: () => useSessionStore().setScene("menu"),
  ingame: () => startRun(),
  battle: () => enterBattle(startRun()),
  badbattle: () => {
    const run = startRun();
    enterBattle(run);
    run.dispatch("debug.applyStatus", { key: "poison", value: 3 });
    run.dispatch("debug.applyStatus", { key: "sleep", value: 1 });
    run.dispatch("debug.applyStatus", { key: "arousal", value: 5 });
    run.dispatch("debug.applyStatus", { key: "sticky", value: 3 });
    run.dispatch("debug.applyStatus", { key: "ds_unique1", value: 2 });
    run.dispatch("debug.setCostume", { key: "half" });
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
