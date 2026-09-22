// インベントリのコマンド: arrangeInventory / resolvePending
import { validateArrangement, applyArrangement } from "../domain/inventory.js";

export const commands = {
  arrangeInventory: {
    phases: ["chapter", "intermission"],
    run: (ctx, { arrangement }) => {
      if (ctx.state.inventory.concealed) return { ok: false, reason: "concealed" };
      const reason = validateArrangement(ctx.state, arrangement, ctx.derive("slotCount"));
      if (reason) return { ok: false, reason };
      applyArrangement(ctx.state, arrangement);
      ctx.emit("arrange", {});
      return { ok: true };
    },
  },

  // 保留 (インベントリあふれ) の解決。arrangement は新しい実体を含む全体の配置、discard=true なら受け取らない
  resolvePending: {
    phases: ["pending"],
    run: (ctx, { index = 0, arrangement = null, discard = false }) => {
      const state = ctx.state;
      const pending = state.progress.pending[index];
      if (!pending) return { ok: false, reason: "unknownPending" };
      if (pending.kind !== "gain") return { ok: false, reason: "unknownPendingKind" };
      if (discard) {
        state.progress.pending.splice(index, 1);
        ctx.emit("pendingDiscard", { uid: pending.entity.uid, kind: pending.entity.kind, defId: pending.entity.defId });
        return { ok: true };
      }
      if (!arrangement) return { ok: false, reason: "arrangementRequired" };
      const reason = validateArrangement(state, arrangement, ctx.derive("slotCount"), [pending.entity]);
      if (reason) return { ok: false, reason };
      if (!arrangement.some((a) => a.uid === pending.entity.uid)) return { ok: false, reason: "missingEntity" };
      state.progress.pending.splice(index, 1);
      state.inventory.entities.push(pending.entity);
      applyArrangement(state, arrangement);
      ctx.emit("gain", { uid: pending.entity.uid, kind: pending.entity.kind, defId: pending.entity.defId, pos: pending.entity.pos });
      ctx.fire("entity.gained", { entity: pending.entity, source: pending.source });
      return { ok: true };
    },
  },
};
