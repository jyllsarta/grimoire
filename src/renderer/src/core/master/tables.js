// ============================================================
// マスタテーブル定義 (05_masterdata の v1)。列定義の実体はここ 1 箇所。
// tools/import.js (CSV → js 生成) と core の検証 (validate.js) が同じ定義を読む。
//
//   columns の要素:
//     "name:type"                                            … 普通の列
//     { list: "actions", fields: ["type:string", "value:integer"] } … リスト列展開 (要素数は実データから決める)
//     { obj: "passive", fields: ["type:string", "values:intarray"] } … オブジェクト列展開
//   型: string / integer (空 = null) / intarray / array (JSON) / boolean (空, FALSE = 偽)
//   mode: "rows" (省略時) = 行の配列 / "object" = 1 行をオブジェクトに
//   メタ列 (出力しない): _skip:boolean、エディション列 _isTrial / _isCien / _isClean:integer
//     (空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ出力)
//   ロケール列: `name-en_us:string` のように列名-ロケール。定義には書かず、CSV にあればそのまま通す
// ============================================================

export const EDITION_COLUMNS = ["_isTrial:integer", "_isCien:integer", "_isClean:integer"];

export const TABLES = [
  {
    name: "config",
    mode: "object",
    columns: [
      "title:string",
      "startSlots:integer",
      "maxSlots:integer",
      "shopOtherSlots:integer",
      "shopRelicSlots:integer",
      "shopRareSlots:integer",
      "rerollPrice:integer",
      "harshnessWeightMisfortune:integer",
      "harshnessWeightStatus:integer",
    ],
  },
  {
    name: "characters",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "key:string",
      "name:string",
      "asKnownAs:string",
      "description:string",
      "hp:integer",
      "power:integer",
      "coins:integer",
      "wings:boolean",
      "imageId:integer",
      "bgmId:string",
      "order:integer",
      "initialEquipmentIds:intarray",
      "initialItemIds:intarray",
      "initialAbilityIds:intarray",
      "startEquipmentIds:intarray",
      "startItemIds:intarray",
      "startAbilityIds:intarray",
      "startRelicIds:intarray",
    ],
  },
  {
    name: "books",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "order:integer",
      "chapterIds:intarray",
      "extraChapterId:integer",
      "harshnessThreshold:integer",
      "bgmId:string",
      "coverImage:string",
      "skin:string",
    ],
  },
  {
    name: "bookRules",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "bookId:integer",
      "key:string",
      "values:intarray",
      "name:string",
      "description:string",
      "icon:string",
    ],
  },
  {
    name: "chapters",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "name:string",
      "description:string",
      "width:integer",
      "healPrice:integer",
      "clearJewelBonus:integer",
      "clearCrownBonus:integer",
      "enemyIds:intarray",
      "bossEnemyId:integer",
      "equipmentIds:intarray",
      "itemIds:intarray",
      "abilityIds:intarray",
      "eventIds:intarray",
      "battleBg:string",
      "bgmId:string",
    ],
  },
  {
    name: "enemies",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "kind:string",
      "slot:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "reward:integer",
      "hp:integer",
      "shield:integer",
    ],
  },
  {
    name: "enemyActions",
    columns: [
      "_skip:boolean",
      ...EDITION_COLUMNS,
      "id:integer",
      "enemyId:integer",
      "order:integer",
      "name:string",
      { list: "actions", fields: ["type:string", "value:integer"] },
    ],
  },
  {
    name: "equipments",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "category:string",
      "durability:integer",
      "power:integer",
      "block:integer",
      "cost:integer",
      "price:integer",
      "size:integer",
      { obj: "passive", fields: ["type:string", "values:intarray"] },
      "locked:boolean",
    ],
  },
  {
    name: "items",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "durability:integer",
      "type:string",
      "values:intarray",
      "cost:integer",
      "price:integer",
      "size:integer",
      "locked:boolean",
      "usableOutOfBattle:boolean",
    ],
  },
  {
    name: "abilities",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "type:string",
      "values:intarray",
      "cost:integer",
      "price:integer",
      "size:integer",
      "durability:integer",
      "rechargeType:string",
      "rechargeValue:integer",
      "locked:boolean",
    ],
  },
  {
    name: "relics",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "rarity:integer",
      "price:integer",
      "crownPrice:integer",
      "type:string",
      "values:intarray",
      "locked:boolean",
    ],
  },
  {
    name: "statuses",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "key:string",
      "kind:string",
      "polarity:string",
      "side:string",
      "duration:string",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "sdLayer:string",
      "effect:string",
      "values:intarray",
      "next:string",
      "order:integer",
    ],
  },
  {
    name: "events",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "kind:string",
      "slot:integer",
      "characterId:integer",
      "name:string",
      "description:string",
      "icon:string",
      "cutin:string",
      "choiceIds:intarray",
      "price:integer",
    ],
  },
  {
    name: "eventChoices",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "label:string",
      "resultText:string",
      { obj: "condition", fields: ["type:string", "values:intarray"] },
      { list: "effects", fields: ["type:string", "value:integer", "value2:integer"] },
    ],
  },
  {
    name: "starNodes",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "kind:string",
      "x:integer",
      "y:integer",
      "fromIds:intarray",
      "effectType:string",
      "values:intarray",
      "delta:integer",
      "gateType:string",
      "gateValue:integer",
      "name:string",
      "description:string",
    ],
  },
  {
    name: "starPresets",
    columns: [...EDITION_COLUMNS, "id:integer", "characterId:integer", "difficulty:string", "nodeIds:intarray", "name:string", "description:string"],
  },
  {
    name: "skits",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "characterId:integer",
      "key:string",
      "type:string",
      "trigger:string",
      "name:string",
      "releaseByLose:boolean",
      "order:integer",
    ],
  },
  {
    name: "skitLines",
    columns: [
      ...EDITION_COLUMNS,
      "id:integer",
      "skitId:integer",
      "order:integer",
      "speaker:string",
      "faceId:integer",
      "text:string",
      "imageId:integer",
      "soundId:string",
    ],
  },
  {
    name: "characterScripts",
    columns: [...EDITION_COLUMNS, "id:integer", "characterId:integer", "key:string", "faceId:integer", "message:string", "order:integer"],
  },
  { name: "systemTexts", columns: [...EDITION_COLUMNS, "id:integer", "key:string", "text:string"] },
  { name: "tips", columns: [...EDITION_COLUMNS, "key:string", "title:string", "body:string"] },
  { name: "credits", columns: [...EDITION_COLUMNS, "id:integer", "section:string", "name:string", "url:string", "order:integer"] },
];

export const TABLE_NAMES = TABLES.map((t) => t.name);

export function tableByName(name) {
  const table = TABLES.find((t) => t.name === name);
  if (!table) throw new Error(`unknown master table: ${name}`);
  return table;
}

// 列定義から「プレーンな列名 → 型」を引く (list / obj 展開列は base 名で)
export function columnTypes(table) {
  const types = {};
  for (const col of table.columns) {
    if (typeof col === "string") {
      const [name, type] = col.split(":");
      types[name] = type;
    } else if (col.obj) {
      types[col.obj] = "object";
    } else if (col.list) {
      types[col.list] = "list";
    }
  }
  return types;
}
