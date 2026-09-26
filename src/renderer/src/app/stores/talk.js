// ============================================================
// talk ストア: ヒロインのセリフ (吹き出し) と表情 (tale の say / setFace)。
// characterScripts のキーごとにランダムに 1 行選び、文字数に応じた時間だけ出す。
// 立ち絵 / SD (CharacterFigure / SdPiece) はここの faceId と hopAt を見る。
// ============================================================
import { defineStore } from "pinia";
import { master } from "@core/master/index.js";

export const DEFAULT_FACE = 1;
export const POISON_FACE = 14; // 毒中はげっそり

export const useTalkStore = defineStore("talk", {
  state: () => ({
    characterId: null,
    message: "",
    updatedAt: 0,
    faceId: DEFAULT_FACE,
    hopAt: 0,
    baseFace: DEFAULT_FACE,
    baloonTimer: null,
    faceTimer: null,
  }),
  actions: {
    bind(characterId) {
      this.characterId = characterId;
      this.faceId = this.baseFace;
    },
    // 毒などで既定の表情が変わるときに呼ぶ
    setBaseFace(faceId) {
      this.baseFace = faceId;
      if (!this.faceTimer) this.faceId = faceId;
    },
    scriptsFor(key) {
      if (this.characterId == null) return [];
      return master.all("characterScripts").filter((x) => x.characterId === this.characterId && x.key === key);
    },
    // key のセリフを 1 つ出す。無ければ何もしない。opts.hop で立ち絵が跳ねる
    say(key, { hop = false } = {}) {
      const list = this.scriptsFor(key);
      if (!list.length) return false;
      const line = list[Math.floor(Math.random() * list.length)];
      this.message = line.message;
      this.updatedAt = Date.now();
      if (line.faceId) this.faceId = line.faceId;
      if (hop) this.hopAt = Date.now();
      clearTimeout(this.baloonTimer);
      clearTimeout(this.faceTimer);
      const dur = Math.max(2600, line.message.length * 130);
      this.baloonTimer = setTimeout(() => {
        this.message = "";
        this.baloonTimer = null;
      }, dur);
      this.faceTimer = setTimeout(() => {
        this.faceId = this.baseFace;
        this.faceTimer = null;
      }, dur + 600);
      return true;
    },
    setFace(faceId, ms = 1200) {
      this.faceId = faceId;
      clearTimeout(this.faceTimer);
      this.faceTimer = setTimeout(() => {
        this.faceId = this.baseFace;
        this.faceTimer = null;
      }, ms);
    },
    hop() {
      this.hopAt = Date.now();
    },
    clear() {
      clearTimeout(this.baloonTimer);
      clearTimeout(this.faceTimer);
      this.baloonTimer = null;
      this.faceTimer = null;
      this.message = "";
      this.faceId = this.baseFace;
    },
  },
});
