// relic.gained: 動詞 gainRelic でレリックを所持した直後 (payload: { relic, def, source })。
// 取得時の即時効果 (maxHpPlus の「現在値も同時に増える」など) はここに登録し、when で自分のインスタンスだけに絞る (R3 Q15)
import { defineStep } from "../_define.js";

export default defineStep({ name: "relic.gained", scope: "run", registrants: "relic.maxHpPlus (100: 現在ライフも増やす)" });
