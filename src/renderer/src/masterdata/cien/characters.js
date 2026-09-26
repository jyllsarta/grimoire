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
    "wings": false,
    "imageId": 0,
    "bgmId": "chara0",
    "order": 0,
    "initialEquipmentIds": [],
    "initialItemIds": [],
    "initialAbilityIds": [],
    "startEquipmentIds": [],
    "startItemIds": [],
    "startAbilityIds": [],
    "startRelicIds": []
  },
  {
    "id": 1,
    "key": "deathscythe",
    "name": "デスサイズちゃん",
    "asKnownAs": "呪われた死神",
    "description": "敬語で寡黙、警戒心が強い。一度戦い出すとトリガーハッピー気味に鎌を振る。搦め手・罠・悪意に非常に弱い。",
    "hp": 30,
    "power": 3,
    "coins": 2,
    "wings": true,
    "imageId": 1,
    "bgmId": "chara1",
    "order": 1,
    "initialEquipmentIds": [
      1011,
      1011,
      1001,
      1002
    ],
    "initialItemIds": [
      2011,
      2011,
      2001
    ],
    "initialAbilityIds": [
      3011
    ],
    "startEquipmentIds": [],
    "startItemIds": [],
    "startAbilityIds": [],
    "startRelicIds": [
      11
    ]
  }
];
