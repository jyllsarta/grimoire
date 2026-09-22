// 派生リスト。一覧と連結規則だけ。各リストの base は 1 ファイルずつ
import { activeSources, moduleOf, uidOf } from "../effects/sources.js";
import { registry } from "../effects/index.js";

import startEntities from "./start_entities.js";
import chapterPanelSpecs from "./chapter_panel_specs.js";
import shopCandidates from "./shop_candidates.js";

const ALL = [startEntities, chapterPanelSpecs, shopCandidates];

export const LISTS = Object.fromEntries(ALL.map((l) => [l.name, l]));
export const LIST_NAMES = ALL.map((l) => l.name);

export function list(name, ctx, args = {}) {
  const def = LISTS[name];
  if (!def) throw new Error(`unknown list: ${name}`);
  let out = [...def.base(ctx, args)];
  const providers = [];
  for (const src of activeSources(ctx.state)) {
    if (src.masked) continue;
    const mod = moduleOf(src);
    if (!mod) continue;
    const l = mod.lists[name];
    if (!l) continue;
    providers.push({ order: l.order, registryIndex: registry.indexOf(mod), uid: uidOf(src), src: { ...src, module: mod }, provide: l.provide });
  }
  providers.sort((a, b) => a.order - b.order || a.registryIndex - b.registryIndex || a.uid - b.uid);
  for (const p of providers) {
    const r = p.provide(ctx, p.src, args, out);
    if (Array.isArray(r)) out = out.concat(r);
  }
  return out;
}
