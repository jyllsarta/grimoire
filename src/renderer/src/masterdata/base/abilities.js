// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 3001,
    "characterId": 1,
    "name": "ライトボール",
    "description": "貫通 3 ダメージ。アイテムか装備を使い切ると再使用可能。",
    "icon": "comet",
    "type": "attack",
    "values": [
      3
    ],
    "cost": 2,
    "price": 2,
    "size": 2,
    "rechargeType": "exhaust",
    "rechargeValue": 1,
    "locked": false
  },
  {
    "id": 3002,
    "characterId": 1,
    "name": "スーパーブロック",
    "description": "このターン 8 ブロック。累計 10 ダメージ被弾で再使用可能。",
    "icon": "barrier_ii",
    "type": "block",
    "values": [
      8
    ],
    "cost": 2,
    "price": 4,
    "size": 2,
    "rechargeType": "damageTaken",
    "rechargeValue": 10,
    "locked": false
  }
];
