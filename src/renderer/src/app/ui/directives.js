// ============================================================
// 小さな Vue ディレクティブ
//   v-hover-se: 子孫の button / カード系にホバー SE を付ける (tale の hoverSe)。main.js で登録する
// ============================================================
import SoundManager from "../sound/sound_manager.js";

const HOVER_SELECTOR = "button, .panel_card, .char_card, .book_card, .inv_ent, .shop_card, .shelf_ent, .star_node";

export const vHoverSe = {
  mounted(el) {
    el.addEventListener("pointerover", (e) => {
      const t = e.target.closest?.(HOVER_SELECTOR);
      if (!t || !el.contains(t)) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return; // 同じ要素の中で動いただけ
      SoundManager.playSe("hover", 0);
    });
  },
};

// ステージの zoom (platform/viewport.js が --zoom に書く)。クライアント座標 → 論理 px の換算に使う
export function stageZoom() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zoom"));
  return Number.isFinite(v) && v > 0 ? v : 1;
}
