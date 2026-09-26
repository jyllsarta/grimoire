// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 1001,
    "characterId": 1,
    "name": "ぼろぼろソード",
    "description": "古くて脆い剣。よわい。",
    "icon": "hocho",
    "category": "weapon",
    "durability": 1,
    "power": 3,
    "block": 0,
    "cost": 1,
    "price": 2,
    "size": 2,
    "locked": false
  },
  {
    "id": 1002,
    "characterId": 1,
    "name": "ぼろぼろシールド",
    "description": "古くて脆い盾。よわい。",
    "icon": "armor",
    "category": "armor",
    "durability": 2,
    "power": 0,
    "block": 2,
    "cost": 2,
    "price": 2,
    "size": 2,
    "locked": false
  },
  {
    "id": 1003,
    "characterId": 1,
    "name": "ウインドソード",
    "description": "風の力を乗せた剣。軽くて強い。",
    "icon": "kama",
    "category": "weapon",
    "durability": 2,
    "power": 4,
    "block": 0,
    "cost": 0,
    "price": 7,
    "size": 2,
    "locked": false
  },
  {
    "id": 1004,
    "characterId": 1,
    "name": "ポイズンアックス",
    "description": "悪いやつが使う毒の斧。",
    "icon": "kama",
    "category": "weapon",
    "durability": 2,
    "power": 3,
    "block": 0,
    "cost": 3,
    "price": 7,
    "size": 2,
    "locked": false,
    "passive": {
      "type": "poison",
      "values": [
        2
      ]
    }
  },
  {
    "id": 1005,
    "characterId": 1,
    "name": "スマッシュレイピア",
    "description": "相手のブロックとシールドを無視する。",
    "icon": "bow",
    "category": "weapon",
    "durability": 3,
    "power": 3,
    "block": 0,
    "cost": 2,
    "price": 7,
    "size": 2,
    "locked": false,
    "passive": {
      "type": "pierce",
      "values": []
    }
  },
  {
    "id": 1006,
    "characterId": 1,
    "name": "きゅうけつナイフ",
    "description": "与えたダメージ分、ライフを回復。",
    "icon": "hocho",
    "category": "weapon",
    "durability": 2,
    "power": 2,
    "block": 0,
    "cost": 2,
    "price": 4,
    "size": 2,
    "locked": false,
    "passive": {
      "type": "drain",
      "values": [
        1
      ]
    }
  },
  {
    "id": 1007,
    "characterId": 1,
    "name": "リーフシールド",
    "description": "軽くて使いやすい盾。脆い。",
    "icon": "armor",
    "category": "armor",
    "durability": 1,
    "power": 0,
    "block": 6,
    "cost": 1,
    "price": 4,
    "size": 1,
    "locked": false
  },
  {
    "id": 1011,
    "characterId": 1,
    "name": "クリティカルナイフ",
    "description": "この武器で攻撃するターン、リーサルサイズの発動対象ライフ +3。",
    "icon": "hocho",
    "category": "weapon",
    "durability": 3,
    "power": 2,
    "block": 0,
    "cost": 2,
    "price": 5,
    "size": 2,
    "locked": false,
    "passive": {
      "type": "lethalThresholdPlus",
      "values": [
        3
      ]
    }
  }
];
