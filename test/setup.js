// vitest 起動シム。base profile のマスタを読み込む。core は Math.random を使わない (state.rng) ので乱数の乗っ取りは不要。
import tables from "@masterdata/index.js";
import { loadMaster } from "@core/master/index.js";

loadMaster(tables);
