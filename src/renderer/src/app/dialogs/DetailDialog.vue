<template>
  <DialogFrame :width="600" dialog-class="detail_dialog" :z-index="600" light close-on-backdrop @backdrop="close">
    <div class="peek_head">
      <div class="peek_icon" :class="{ shape_icon: view.shape }">
        <Shape v-if="view.shape" :kind="view.shape" :text="null" />
        <img v-else class="icon_img" :src="view.icon" alt="" />
      </div>
      <div>
        <div class="peek_title">{{ view.name }}</div>
        <div v-if="view.kindText" class="kind_line">
          <span class="chip">{{ view.kindText }}</span
          ><span v-if="view.rarity" class="rarity">{{ "★".repeat(view.rarity) }}</span>
        </div>
        <div class="peek_desc">{{ view.description }}</div>
      </div>
    </div>
    <Ornament kind="rule" />
    <div class="peek_body">
      <div v-if="view.statLine" class="stat_line">{{ view.statLine }}</div>
      <div v-if="view.effects?.length" class="fx_line">
        <Shape v-for="(f, i) in view.effects" :key="i" :kind="f.shape" :text="f.n" size="small" />
      </div>
      <div v-for="(row, i) in view.rows" :key="i" class="row" :class="row.cls">
        <span class="row_label">{{ row.label }}</span
        ><span class="row_value">{{ row.value }}</span>
      </div>
      <div v-if="view.routines" class="routines">
        <div v-for="(r, i) in view.routines" :key="r.id" class="routine" :class="{ current: i === view.routineIndex }">
          <span class="routine_no">{{ i + 1 }}</span>
          <span class="routine_shapes"><Shape v-for="(s, j) in r.shapes" :key="j" :kind="s.shape" :text="s.text" size="small" /></span>
          <span class="routine_name">{{ r.name }}</span>
        </div>
      </div>
    </div>
    <div class="click_hint hint">{{ T("detail.clickToClose") }}</div>
  </DialogFrame>
</template>

<script setup>
// 個体の詳細 (右クリック。07「右クリックで個体説明 / tips」)。params.desc = "<kind>:<id|key>"、params.ref = "uid:<uid>" | "cell:<cell>" | "battle"
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { defOf } from "@core/domain/entity.js";
import { enemyRoutines } from "@core/domain/board.js";
import { findEntity } from "@core/domain/inventory.js";
import { panelAt, q, rechargeInfo } from "@core/queries/index.js";
import { useRunStore } from "../stores/run.js";
import { iconPath, kindLabel, panelStatLine, entEffects, entCountText } from "../ui/entity_view.js";
import { STATUS_SHAPE, actionShape } from "../ui/shapes.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import DialogFrame from "./DialogFrame.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

const props = defineProps({ dialog: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const run = useRunStore();

function refEnemy(ref) {
  const s = run.state;
  if (!s) return null;
  if (ref === "battle" && s.battle) return s.board.panels[s.battle.panelUid]?.enemy ?? null;
  const m = /^cell:(\d+)$/.exec(ref || "");
  if (m) return panelAt(s, Number(m[1]))?.enemy ?? null;
  return null;
}

const view = computed(() => {
  const [kind, idText] = String(props.dialog.params.desc).split(":");
  const ref = props.dialog.params.ref;
  if (kind === "status") {
    const def = master.byKey("statuses", idText);
    return {
      shape: STATUS_SHAPE[def.key] || "status",
      name: def.name,
      kindText: T(`status.kind.${def.kind}`),
      description: def.description,
      rows: [],
    };
  }
  const id = Number(idText);
  if (kind === "enemy") {
    const def = master.get("enemies", id);
    const enemy = refEnemy(ref);
    const rows = [];
    const maxHp = run.state ? q(run.state).derive("enemyMaxHp", { defId: id }) : def.hp;
    rows.push({ label: T("detail.enemyHp"), value: enemy ? `${Math.max(0, enemy.hp)} / ${maxHp}` : `${maxHp}` });
    if ((enemy?.shield ?? def.shield) > 0) rows.push({ label: T("battle.enemyShield"), value: enemy ? enemy.shield : def.shield });
    if (enemy?.block > 0) rows.push({ label: T("common.block"), value: enemy.block });
    rows.push({ label: T("detail.reward"), value: T("detail.coinN", { n: def.reward }) });
    const routines = enemyRoutines(id).map((r) => ({
      id: r.id,
      name: r.name,
      shapes: r.actions.length
        ? r.actions.map((a) => actionShape(a, a.type === "attack" && run.state ? q(run.state).derive("enemyAttack", { action: a }) : null))
        : [actionShape(null)],
    }));
    const kindText =
      def.kind === "characterUnique"
        ? T("enemy.kind.characterUnique")
        : def.kind === "placeholder"
          ? T("enemy.kind.placeholder")
          : T("enemy.kind.normal");
    return {
      icon: iconPath(def.icon),
      name: def.name,
      kindText,
      description: def.description,
      rows,
      routines,
      routineIndex: enemy ? enemy.routineIndex % Math.max(1, routines.length) : -1,
    };
  }
  if (kind === "event") {
    const def = master.get("events", id);
    return {
      icon: iconPath(def.icon),
      name: def.name,
      kindText: def.kind === "misfortune" ? T("panel.misfortuneSub") : T("kind.event"),
      description: def.description,
      rows: [],
    };
  }
  if (kind === "relic") {
    const def = master.get("relics", id);
    return { icon: iconPath(def.icon), name: def.name, kindText: T("kind.relic"), rarity: def.rarity, description: def.description, rows: [] };
  }
  // equipment / item / ability
  const def = defOf(kind, id);
  const rows = [];
  const m = /^uid:(\d+)$/.exec(ref || "");
  const ent = m && run.state ? findEntity(run.state, Number(m[1])) : null;
  if (ent) {
    rows.push({ label: T("detail.remaining"), value: entCountText(kind, def, kind === "ability" ? { ...ent, ready: true } : ent) ?? "∞" });
    if (kind === "equipment") rows.push({ label: T("detail.state"), value: ent.active ? T("inventory.on") : T("inventory.off") });
    if (kind === "ability") {
      const info = rechargeInfo(ent);
      rows.push({ label: T("detail.recharge"), value: T(info.textKey, { n: info.target ?? "" }) });
      if (!info.ready) rows.push({ label: T("detail.progress"), value: `${info.progress ?? 0} / ${info.target ?? "-"}`, cls: "bad" });
    }
  } else if (kind === "ability") {
    const info = rechargeInfo({ kind: "ability", defId: def.id, ready: true, progress: 0 });
    rows.push({ label: T("detail.recharge"), value: T(info.textKey, { n: info.target ?? "" }) });
  }
  if (def.cost != null) rows.push({ label: T("detail.cost"), value: T("detail.coinN", { n: def.cost }) });
  return {
    icon: iconPath(def.icon),
    name: def.name,
    kindText: kindLabel(kind),
    description: def.description,
    statLine: panelStatLine(kind, def),
    effects: entEffects(kind, def, ent),
    rows,
  };
});

function close() {
  SoundManager.playSe("cancel");
  emit("close", null);
}
</script>

<style lang="scss" scoped>
:deep(.detail_dialog) {
  padding: 26px 32px 18px;
}
.shape_icon {
  background: var(--color-base5);
}
.kind_line {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  .rarity {
    color: var(--color-main1);
    font-size: var(--font-size-small);
  }
}
.stat_line {
  color: var(--color-main1);
  font-size: var(--font-size-small);
}
.fx_line {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}
.row {
  margin-top: 6px;
  display: flex;
  gap: 12px;
  font-size: var(--font-size-small);
  .row_label {
    color: var(--color-white3);
    min-width: 110px;
  }
  .row_value {
    color: var(--color-white0);
  }
  &.bad .row_value {
    color: var(--color-negative1);
  }
}
.routines {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  .routine {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px;
    border-radius: var(--radius-card);
    color: var(--color-white3);
    &.current {
      background: rgba(255, 228, 178, 0.14);
      color: var(--color-white0);
    }
    .routine_no {
      width: 16px;
      font-size: var(--font-size-mini);
    }
    .routine_shapes {
      display: flex;
      gap: 2px;
    }
    .routine_name {
      font-size: var(--font-size-small);
    }
  }
}
.click_hint {
  margin-top: 16px;
  text-align: center;
}
</style>
