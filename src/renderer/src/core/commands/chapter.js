// 章画面のコマンド: takePanel / takePanelArranged / dumpPanel / startBattle / chooseEvent / takeChapterClear / giveUp
import { master } from "../master/index.js";
import { panelAt, isSelectableCell, removePanel } from "../domain/board.js";
import { createBattle } from "../domain/battle.js";
import { validateArrangement, applyArrangement } from "../domain/inventory.js";
import { choiceAvailable } from "../domain/event.js";
import { defOf } from "../domain/entity.js";
import { registry } from "../effects/index.js";

const TAKEABLE = ["equipment", "item", "ability"];

function selectablePanel(ctx, cell) {
  if (!isSelectableCell(ctx.state, cell)) return { error: "notSelectable" };
  const panel = panelAt(ctx.state, cell);
  if (!panel) return { error: "emptyCell" };
  return { panel };
}

// 回収時の割り込み (R3 Q7 onTake)。装備はパッシブ、アイテム / アビリティは type のモジュールが持つ。true を返したらインベントリに入らない
function takeInterceptor(kind, def) {
  if (kind === "equipment") return def.passive?.type ? registry.find("passive", def.passive.type) : null;
  return registry.find(kind, def.type);
}

function takePanel(ctx, { cell, arrangement = null }) {
  const { panel, error } = selectablePanel(ctx, cell);
  if (error) return { ok: false, reason: error };
  if (!TAKEABLE.includes(panel.kind)) return { ok: false, reason: "notTakeable" };
  const def = defOf(panel);
  const cost = ctx.derive("panelCost", { def, panel });
  if (ctx.state.wallet.coin < cost) return { ok: false, reason: "coins" };
  if (arrangement) {
    const reason = validateArrangement(ctx.state, arrangement, ctx.derive("slotCount"));
    if (reason) return { ok: false, reason };
    applyArrangement(ctx.state, arrangement);
  }
  ctx.state.wallet.coin -= cost;
  const spec = { kind: panel.kind, defId: panel.defId, uid: panel.uid };
  removePanel(ctx, cell);
  ctx.emit("panelTake", { cell, ...spec, cost });
  const mod = takeInterceptor(panel.kind, def);
  const src = {
    family: panel.kind === "equipment" ? "passive" : panel.kind,
    key: mod?.key,
    def,
    values: (panel.kind === "equipment" ? def.passive?.values : def.values) || [],
  };
  if (mod?.onTake && mod.onTake(ctx, src, spec) === true) {
    ctx.fire("panel.taken", { entity: null, panel: spec });
    return { ok: true, uid: null, pending: false };
  }
  const entity = ctx.gain(spec.kind, spec.defId, { source: { family: "panel", key: "take", defId: spec.defId } });
  ctx.fire("panel.taken", { entity, panel: spec });
  return { ok: true, uid: entity.uid, pending: entity.pos < 0 };
}

export const commands = {
  takePanel: { phases: ["chapter"], run: (ctx, { cell }) => takePanel(ctx, { cell }) },
  takePanelArranged: { phases: ["chapter"], run: (ctx, { cell, arrangement }) => takePanel(ctx, { cell, arrangement }) },

  dumpPanel: {
    phases: ["chapter"],
    run: (ctx, { cell }) => {
      const { panel, error } = selectablePanel(ctx, cell);
      if (error) return { ok: false, reason: error };
      if (!TAKEABLE.includes(panel.kind)) return { ok: false, reason: "notDumpable" };
      const spec = { kind: panel.kind, defId: panel.defId, uid: panel.uid };
      removePanel(ctx, cell);
      ctx.state.wallet.coin += 1;
      ctx.emit("panelDump", { cell, ...spec, coin: 1 });
      ctx.fire("panel.dumped", { panel: spec });
      return { ok: true };
    },
  },

  startBattle: {
    phases: ["chapter"],
    run: (ctx, { cell }) => {
      const { panel, error } = selectablePanel(ctx, cell);
      if (error) return { ok: false, reason: error };
      if (panel.kind !== "enemy") return { ok: false, reason: "notEnemy" };
      ctx.state.battle = createBattle(panel.uid);
      return { ok: true };
    },
  },

  chooseEvent: {
    phases: ["chapter"],
    run: (ctx, { cell, choiceIndex }) => {
      const { panel, error } = selectablePanel(ctx, cell);
      if (error) return { ok: false, reason: error };
      if (panel.kind !== "event") return { ok: false, reason: "notEvent" };
      const event = master.get("events", panel.defId);
      const choiceId = event.choiceIds[choiceIndex];
      if (choiceId == null) return { ok: false, reason: "unknownChoice" };
      const choice = master.get("eventChoices", choiceId);
      if (!choiceAvailable(ctx, choice)) return { ok: false, reason: "choiceLocked" };
      const spec = { kind: "event", defId: panel.defId, uid: panel.uid };
      removePanel(ctx, cell);
      ctx.emit("eventChoose", { cell, ...spec, choiceId });
      for (const eff of choice.effects || []) {
        const mod = registry.find("eventEffect", eff.type);
        if (!mod) throw new Error(`eventChoices ${choiceId}: 不明な効果 type "${eff.type}"`);
        mod.use(ctx, { family: "eventEffect", key: eff.type, def: event, choice }, eff);
      }
      ctx.fire("event.resolved", { event, choice, misfortune: event.kind === "misfortune" });
      return { ok: true };
    },
  },

  takeChapterClear: {
    phases: ["chapter"],
    run: (ctx, { cell }) => {
      const { panel, error } = selectablePanel(ctx, cell);
      if (error) return { ok: false, reason: error };
      if (panel.kind !== "chapterClear") return { ok: false, reason: "notChapterClear" };
      ctx.emit("chapterClearTake", { cell, uid: panel.uid });
      ctx.fire("chapter.clear", { chapterId: ctx.state.board.chapterId });
      return { ok: true, ending: ctx.state.progress.ending };
    },
  },

  giveUp: {
    phases: ["chapter", "intermission"],
    run: (ctx) => {
      ctx.state.progress.ending = "abandoned";
      ctx.fire("run.end", { ending: "abandoned" });
      return { ok: true };
    },
  },
};
