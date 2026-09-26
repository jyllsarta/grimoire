// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 1001,
    "characterId": 1,
    "kind": "origin",
    "x": 0,
    "y": 0,
    "fromIds": [],
    "effectType": "",
    "values": [],
    "delta": 0,
    "gateType": "",
    "name": "原点",
    "description": "すべての星はここから始まる。いつも有効。"
  },
  {
    "id": 1002,
    "characterId": 1,
    "kind": "node",
    "x": 0,
    "y": 120,
    "fromIds": [
      1001
    ],
    "effectType": "maxHpPlus",
    "values": [
      5
    ],
    "delta": 2,
    "gateType": "",
    "name": "がんじょう",
    "description": "最大ライフ +5。"
  },
  {
    "id": 1003,
    "characterId": 1,
    "kind": "node",
    "x": -150,
    "y": 240,
    "fromIds": [
      1002
    ],
    "effectType": "powerPlus",
    "values": [
      1
    ],
    "delta": 4,
    "gateType": "",
    "name": "ちからこぶ",
    "description": "基礎こうげき +1。"
  },
  {
    "id": 1004,
    "characterId": 1,
    "kind": "node",
    "x": 150,
    "y": 240,
    "fromIds": [
      1002
    ],
    "effectType": "slotPlus",
    "values": [
      2
    ],
    "delta": 4,
    "gateType": "",
    "name": "大きなポケット",
    "description": "インベントリ +2。"
  },
  {
    "id": 1011,
    "characterId": 1,
    "kind": "node",
    "x": 0,
    "y": -120,
    "fromIds": [
      1001
    ],
    "effectType": "maxHpMinus",
    "values": [
      5
    ],
    "delta": -1,
    "gateType": "",
    "name": "ひよわ",
    "description": "最大ライフ -5。"
  },
  {
    "id": 1012,
    "characterId": 1,
    "kind": "node",
    "x": -150,
    "y": -240,
    "fromIds": [
      1011
    ],
    "effectType": "enemyHpPlus",
    "values": [
      2
    ],
    "delta": -2,
    "gateType": "",
    "name": "強い敵",
    "description": "全ての敵のライフ +2。"
  },
  {
    "id": 1013,
    "characterId": 1,
    "kind": "node",
    "x": 150,
    "y": -240,
    "fromIds": [
      1011
    ],
    "effectType": "badDurationPlus",
    "values": [
      1
    ],
    "delta": -2,
    "gateType": "",
    "name": "呪われ体質",
    "description": "受ける状態異常 +1。"
  },
  {
    "id": 1014,
    "characterId": 1,
    "kind": "node",
    "x": 300,
    "y": -360,
    "fromIds": [
      1013
    ],
    "effectType": "misfortuneCandidate",
    "values": [
      13
    ],
    "delta": -2,
    "gateType": "",
    "name": "呪われ体質・沼",
    "description": "幕間で「怪しいプール」が売られるようになる。"
  },
  {
    "id": 1015,
    "characterId": 1,
    "kind": "node",
    "x": -300,
    "y": -360,
    "fromIds": [
      1012
    ],
    "effectType": "chapterEnemy",
    "values": [
      39,
      1
    ],
    "delta": -2,
    "gateType": "",
    "name": "鎧の先ぶれ",
    "description": "一章に「呪い鎧」が 1 体増える。"
  },
  {
    "id": 1021,
    "characterId": 1,
    "kind": "gate",
    "x": 0,
    "y": -360,
    "fromIds": [
      1012,
      1013
    ],
    "effectType": "",
    "values": [],
    "delta": 0,
    "gateType": "clearAny",
    "name": "深淵の入り口",
    "description": "本を 1 冊制覇すると開く。"
  },
  {
    "id": 1022,
    "characterId": 1,
    "kind": "node",
    "x": 0,
    "y": -480,
    "fromIds": [
      1021
    ],
    "effectType": "startHpMinus",
    "values": [
      10
    ],
    "delta": -3,
    "gateType": "",
    "name": "深淵",
    "description": "一章の開始ライフ -10。"
  }
];
