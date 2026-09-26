// =====================================================================
// data/SCHEMA.md を効果モジュールのレジストリとテーブル定義から生成する (05: 手書きしない)
//   node tools/gen_schema.js          … 生成
//   node tools/gen_schema.js --check  … コミット済みと差分がないか (CI 用)
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, TABLES } from "./lib.js";
import { registry } from "../src/renderer/src/core/effects/index.js";
import { DERIVED } from "../src/renderer/src/core/derived/index.js";
import { PERMISSION_NAMES } from "../src/renderer/src/core/permissions/index.js";
import { LIST_NAMES } from "../src/renderer/src/core/lists/index.js";
import { STEPS } from "../src/renderer/src/core/steps/index.js";

const FAMILY_DESC = {
  status: "statuses.effect (省略時 key)。kind=common|unique|buff",
  costume: "statuses.effect (省略時 key)。kind=costume",
  bookRule: "bookRules.key",
  passive: "equipments.passive.type",
  relic: "relics.type",
  star: "starNodes.effectType",
  item: "items.type",
  ability: "abilities.type",
  enemyAction: "enemyActions.actions[i].type (statuses.key (common|unique) も書ける: value = 量)",
  eventEffect: "eventChoices.effects[i].type (values[0] = value、values[1] = value2)",
  choiceCondition: "eventChoices.condition.type (選択肢を出す条件。check が true なら選べる)",
};

function columnsOf(table) {
  return table.columns
    .map((c) => {
      if (typeof c === "string") return c;
      if (c.obj) return `${c.obj}.{${c.fields.join(", ")}}`;
      if (c.list) return `${c.list}[i].{${c.fields.join(", ")}}`;
      return "";
    })
    .join(", ");
}

function hooksOf(mod) {
  const parts = [];
  for (const [step, h] of Object.entries(mod.hooks)) parts.push(`hook ${step}@${h.order}`);
  for (const [name, m] of Object.entries(mod.modifiers)) parts.push(`${name} (${m.stage}@${m.order})`);
  for (const [name, p] of Object.entries(mod.permissions)) parts.push(`permission ${name}@${p.order}`);
  for (const [name, l] of Object.entries(mod.lists)) parts.push(`list ${name}@${l.order}`);
  if (mod.use) parts.push("use");
  if (mod.onApply) parts.push("onApply");
  if (mod.onExpire) parts.push("onExpire");
  return parts.join(", ") || "-";
}

export function renderSchema() {
  const lines = [];
  lines.push("# マスターデータ スキーマ (生成物)");
  lines.push("");
  lines.push("`node tools/gen_schema.js` が core/effects のレジストリと core/master/tables.js から生成する。**手書きしない**。");
  lines.push("記法とパイプラインは docs/05_masterdata.md、値の意味は各効果モジュールのコメントが正。");
  lines.push("");
  lines.push("## テーブルと列");
  lines.push("");
  lines.push("| テーブル | 列 |");
  lines.push("|---|---|");
  for (const t of TABLES) lines.push(`| ${t.name}${t.mode === "object" ? " (1 行)" : ""} | ${columnsOf(t)} |`);
  lines.push("");
  lines.push(
    "メタ列: `_skip` (TRUE の行は出力しない)、`_isTrial` / `_isCien` / `_isClean` (空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ)。ロケール列は `列名-ロケール` (例 `name-en_us`)。",
  );
  lines.push("");
  lines.push("## 効果の type 一覧 (レジストリ順 = 同 order の同点解決の順)");
  lines.push("");
  for (const family of registry.families) {
    lines.push(`### ${family} — ${FAMILY_DESC[family]}`);
    lines.push("");
    lines.push("| type | values | refs | 登録先 |");
    lines.push("|---|---|---|---|");
    for (const mod of registry.byFamily(family)) {
      const values = mod.values.length
        ? mod.values
            .map((v, i) => `[${i}] ${v.name}: ${v.type}${v.min != null ? ` ≥ ${v.min}` : ""}${v.max != null ? ` ≤ ${v.max}` : ""}`)
            .join("<br>")
        : "(なし)";
      const refs = mod.refs.length ? mod.refs.map((r) => `[${r.index}] → ${r.table}.id`).join("<br>") : "-";
      lines.push(`| \`${mod.key}\` | ${values} | ${refs} | ${hooksOf(mod)} |`);
    }
    lines.push("");
  }
  lines.push("## ステップと標準処理の order");
  lines.push("");
  lines.push("| ステップ | 種別 | 標準処理 (order) | 典型的な登録者 |");
  lines.push("|---|---|---|---|");
  for (const step of STEPS) {
    const kind =
      step.scope === "run"
        ? "コマンド内で同期"
        : step.input
          ? "battle: 入力待ち"
          : step.terminal
            ? "battle: 終端"
            : step.settle
              ? "battle: settle"
              : "battle";
    const standard = step.standard.map((s) => `${s.name} (${s.order})`).join(", ") || "-";
    lines.push(`| \`${step.name}\` | ${kind} | ${standard} | ${step.registrants || "-"} |`);
  }
  lines.push("");
  lines.push("## 派生値 / 許可 / 派生リスト");
  lines.push("");
  lines.push(
    `- 派生値: ${Object.values(DERIVED)
      .map((d) => `\`${d.name}\` (${d.kind})`)
      .join(", ")}`,
  );
  lines.push(`- 許可: ${PERMISSION_NAMES.map((k) => `\`${k}\``).join(", ")}`);
  lines.push(`- 派生リスト: ${LIST_NAMES.map((k) => `\`${k}\``).join(", ")}`);
  lines.push("");
  lines.push("## テストデータの約束");
  lines.push("");
  lines.push(
    "「先頭が 9 で既存と桁が違う ID」はテストデータとして自由に追加・変更してよい。enemyActions は敵 1 体につき 4 行 (order 1..4、id = 敵 id × 10 + order)、使わない行は `_skip`。ID 空間の分割は人間の認知用で、ロジックは ID の値で分岐しない。",
  );
  lines.push("");
  return lines.join("\n");
}

const file = path.join(DATA_DIR, "SCHEMA.md");
const text = renderSchema();
if (process.argv.includes("--check")) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current !== text) {
    console.log("data/SCHEMA.md がレジストリと一致しない。node tools/gen_schema.js で生成し直して");
    process.exit(1);
  }
  console.log("data/SCHEMA.md は最新");
} else {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, text, "utf8");
  console.log(`生成: ${file}`);
}
