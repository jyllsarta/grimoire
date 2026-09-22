// enemyStrikeFlags: 敵のいまのルーチンの属性 (pierce など)。寄与: enemyAction.pierce
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "enemyStrikeFlags", kind: "flags", base: () => [] });
