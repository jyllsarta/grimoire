// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 0,
    "key": "oracle",
    "name": "オラクルちゃん",
    "asKnownAs": "呪いの本の持ち込み人",
    "description": "呪いの本を持ち込んできた。本を持たないので挑戦はできない (仮データ)。",
    "hp": 20,
    "power": 2,
    "coins": 2,
    "imageId": 0,
    "bgmId": "chara0",
    "order": 0,
    "initialEquipmentIds": [],
    "initialItemIds": [],
    "initialAbilityIds": [],
    "startEquipmentIds": [],
    "startItemIds": [],
    "startAbilityIds": []
  },
  {
    "id": 1,
    "key": "deathscythe",
    "name": "デスサイズちゃん",
    "asKnownAs": "呪われた死神",
    "description": "本に呪われてしまった (仮データ。素材はシンティラを流用)。",
    "hp": 30,
    "power": 3,
    "coins": 2,
    "imageId": 1,
    "bgmId": "chara1",
    "order": 1,
    "initialEquipmentIds": [
      1001,
      1001,
      1002,
      1002,
      1003
    ],
    "initialItemIds": [
      2001,
      2001
    ],
    "initialAbilityIds": [
      3001
    ],
    "startEquipmentIds": [],
    "startItemIds": [],
    "startAbilityIds": [
      3001
    ]
  }
];
