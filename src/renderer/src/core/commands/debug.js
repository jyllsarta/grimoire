// 開発用コマンド (01「開発ビルド限定」)。全部コマンド経由で state を変える。app 側が __IS_PROD__ で出さないだけで、core は区別しない
import { createRng } from "../rng.js";
import { master } from "../master/index.js";

const ANY = ["chapter", "battle", "intermission", "pending"];

export const commands = {
  "debug.addCoin": { phases: ANY, run: (ctx, { amount = 10 }) => ((ctx.state.wallet.coin += amount), { ok: true }) },
  "debug.addJewel": { phases: ANY, run: (ctx, { amount = 10 }) => ((ctx.state.wallet.jewel += amount), { ok: true }) },
  "debug.addCrown": { phases: ANY, run: (ctx, { amount = 3 }) => ((ctx.state.wallet.crown += amount), { ok: true }) },
  "debug.healFull": {
    phases: ANY,
    run: (ctx) => {
      ctx.state.player.hp = ctx.derive("maxHp");
      return { ok: true };
    },
  },
  "debug.applyStatus": {
    phases: ANY,
    run: (ctx, { key, value = 1, target = "player" }) => {
      if (!master.findByKey("statuses", key)) return { ok: false, reason: "unknownStatus" };
      const applied = ctx.applyStatus(target === "enemy" && ctx.state.battle ? ctx.state.battle.panelUid : "player", key, value, {
        source: { family: "debug", key: "applyStatus" },
      });
      return { ok: true, applied };
    },
  },
  "debug.setCostume": { phases: ANY, run: (ctx, { key }) => ({ ok: true, changed: ctx.setCostume(key, "debug") }) },
  "debug.crossBreak": { phases: ANY, run: (ctx) => ({ ok: true, changed: ctx.crossBreak() }) },
  "debug.reseed": {
    phases: ANY,
    run: (ctx, { seed }) => {
      ctx.state.rng = createRng(seed ?? Date.now() % 1000000);
      return { ok: true, seed: ctx.state.rng.seed };
    },
  },
  // 戦闘即勝利: result を立てて次の settle で battle.victory に進む
  "debug.winBattle": {
    phases: ["battle"],
    run: (ctx) => {
      const b = ctx.state.battle;
      if (b.step === "battle.end") return { ok: false, reason: "battleEnded" };
      ctx.enemy().hp = 0;
      b.result = "victory";
      b.step = "battle.victory";
      b.cursor = 0;
      return { ok: true };
    },
  },
  // 章スキップ: いまの章をクリアしたことにする
  "debug.clearChapter": {
    phases: ["chapter"],
    run: (ctx) => {
      ctx.fire("chapter.clear", { chapterId: ctx.state.board.chapterId, debug: true });
      return { ok: true, ending: ctx.state.progress.ending };
    },
  },
  "debug.gain": {
    phases: ["chapter", "intermission"],
    run: (ctx, { kind, defId }) => {
      const entity = ctx.gain(kind, defId, { source: { family: "debug", key: "gain" } });
      return { ok: true, uid: entity.uid };
    },
  },
  "debug.addRelic": {
    phases: ANY,
    run: (ctx, { defId }) => {
      master.get("relics", defId);
      if (ctx.state.relics.some((r) => r.defId === defId)) return { ok: false, reason: "alreadyOwned" };
      ctx.state.relics.push({ uid: ctx.uid(), defId, memo: {} });
      return { ok: true };
    },
  },
};
