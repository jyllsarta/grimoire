// バトルのコマンド: attack / flee / cancelBattle / closeBattle / useItem / toggleEquip / useAbility
import { master } from "../master/index.js";
import { findEntity } from "../domain/inventory.js";
import { registry } from "../effects/index.js";
import { settleAfterFreeAction } from "./advance.js";

function entityOr(ctx, uid, kind) {
  const entity = findEntity(ctx.state, uid);
  if (!entity) return { error: "unknownEntity" };
  if (entity.kind !== kind) return { error: `not${kind[0].toUpperCase()}${kind.slice(1)}` };
  return { entity };
}

export const commands = {
  attack: {
    phases: ["battle"],
    step: "select",
    run: (ctx) => {
      ctx.state.battle.step = "turn.command";
      ctx.emit("step", { from: "select", to: "turn.command" });
      return { ok: true };
    },
  },

  flee: {
    phases: ["battle"],
    step: "select",
    run: (ctx) => {
      ctx.state.battle.step = "flee.command";
      ctx.emit("step", { from: "select", to: "flee.command" });
      return { ok: true };
    },
  },

  cancelBattle: {
    phases: ["battle"],
    step: "select",
    run: (ctx) => {
      if (ctx.state.battle.started) return { ok: false, reason: "battleStarted" };
      ctx.state.battle = null;
      ctx.emit("battleCancel", {});
      return { ok: true };
    },
  },

  closeBattle: {
    phases: ["battle"],
    step: "battle.end",
    run: (ctx) => {
      const result = ctx.state.battle.result;
      ctx.state.battle = null;
      ctx.emit("battleClose", { result });
      return { ok: true, result };
    },
  },

  // items.usableOutOfBattle のものは chapter / intermission でも (許可は permission canUseItem が見る)
  useItem: {
    phases: ["battle", "chapter", "intermission"],
    run: (ctx, { uid }) => {
      if (ctx.state.battle && ctx.state.battle.step !== "select") return { ok: false, reason: `step.${ctx.state.battle.step}` };
      const { entity, error } = entityOr(ctx, uid, "item");
      if (error) return { ok: false, reason: error };
      const perm = ctx.permission("canUseItem", { entity });
      if (!perm.ok) return { ok: false, reason: perm.reason };
      const def = master.get("items", entity.defId);
      const mod = registry.find("item", def.type);
      if (!mod) throw new Error(`items ${def.id}: 不明な type "${def.type}"`);
      const src = { family: "item", key: def.type, def, instance: entity, values: def.values || [] };
      const used = mod.use(ctx, src);
      if (used === false) return { ok: false, reason: "itemUseBlocked" };
      ctx.emit("itemUse", { uid, defId: def.id });
      ctx.spend(entity);
      ctx.fire("action.item", { entity, def });
      settleAfterFreeAction(ctx);
      return { ok: true };
    },
  },

  toggleEquip: {
    phases: ["battle"],
    step: "select",
    run: (ctx, { uid }) => {
      const { entity, error } = entityOr(ctx, uid, "equipment");
      if (error) return { ok: false, reason: error };
      if (entity.active) {
        entity.active = false;
      } else {
        const perm = ctx.permission("canActivateEquipment", { entity });
        if (!perm.ok) return { ok: false, reason: perm.reason };
        entity.active = true;
      }
      ctx.emit("equipToggle", { uid, active: entity.active });
      ctx.fire("action.equipToggle", { entity, active: entity.active });
      return { ok: true, active: entity.active };
    },
  },

  useAbility: {
    phases: ["battle"],
    step: "select",
    run: (ctx, { uid }) => {
      const { entity, error } = entityOr(ctx, uid, "ability");
      if (error) return { ok: false, reason: error };
      const perm = ctx.permission("canUseAbility", { entity });
      if (!perm.ok) return { ok: false, reason: perm.reason };
      const def = master.get("abilities", entity.defId);
      const mod = registry.find("ability", def.type);
      if (!mod) throw new Error(`abilities ${def.id}: 不明な type "${def.type}"`);
      const src = { family: "ability", key: def.type, def, instance: entity, values: def.values || [] };
      mod.use(ctx, src);
      ctx.emit("abilityUse", { uid, defId: def.id });
      if (def.rechargeType && def.rechargeType !== "none") {
        entity.ready = false;
        entity.progress = 0;
      }
      if (entity.durability > 0) ctx.spend(entity);
      ctx.recharge("otherAbilityUse", 1, { excludeDefId: def.id });
      ctx.fire("action.ability", { entity, def });
      settleAfterFreeAction(ctx);
      return { ok: true };
    },
  },
};
