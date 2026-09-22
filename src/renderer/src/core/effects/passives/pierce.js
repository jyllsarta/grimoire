// 装備パッシブ pierce: 一撃が敵ブロックを無視する (合算 1 発に乗る)
import { defineEffect } from "../define.js";

export default defineEffect({
  family: "passive",
  key: "pierce",
  values: [],
  text: { shape: "pierce" },
  modifiers: {
    strikeFlags: { stage: "flat", order: 300, apply: () => ({ label: "passive.pierce", value: "pierce" }) },
  },
});
