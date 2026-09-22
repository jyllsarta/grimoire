// strikeFlags: 一撃の属性 (pierce / blitz / drain / poisonApply)。合算 1 発に全部乗る。寄与: passive.*
import { defineDerived } from "./_define.js";

export default defineDerived({ name: "strikeFlags", kind: "flags", base: () => [] });
