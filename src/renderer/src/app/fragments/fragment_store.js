// フラグメント (画面演出) の管理 (xqueens FragmentManager 方式、tricy の reactive store)
import { reactive } from "vue";

let fragmentUid = 1;

export const fragmentStore = reactive({ active: [] });

export function addFragment(type, params = {}) {
  fragmentStore.active.push({ id: fragmentUid++, type, params });
}

export function removeFragment(id) {
  const idx = fragmentStore.active.findIndex((f) => f.id === id);
  if (idx >= 0) fragmentStore.active.splice(idx, 1);
}

export function clearFragments() {
  fragmentStore.active.splice(0);
}
