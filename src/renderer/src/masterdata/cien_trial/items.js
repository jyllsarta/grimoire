// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 2001,
    "characterId": 1,
    "name": "おにぎり",
    "description": "ライフ +3。戦闘の外でも食べられる。",
    "icon": "butter",
    "durability": 1,
    "type": "instantHeal",
    "values": [
      3
    ],
    "cost": 0,
    "price": 2,
    "size": 1,
    "locked": false,
    "usableOutOfBattle": true
  },
  {
    "id": 2002,
    "characterId": 1,
    "name": "ファイアクラッカー",
    "description": "投げるとはでに爆発。5 ダメージ。",
    "icon": "fire",
    "durability": 1,
    "type": "attack",
    "values": [
      5
    ],
    "cost": 1,
    "price": 2,
    "size": 1,
    "locked": false,
    "usableOutOfBattle": false
  },
  {
    "id": 2003,
    "characterId": 1,
    "name": "簡易シールド",
    "description": "このバトル中シールド +5。",
    "icon": "barrier",
    "durability": 2,
    "type": "shield",
    "values": [
      5
    ],
    "cost": 2,
    "price": 4,
    "size": 2,
    "locked": false,
    "usableOutOfBattle": false
  },
  {
    "id": 92001,
    "characterId": 1,
    "name": "みずぎ",
    "description": "特殊衣装に着替える (テスト用)。1 ターン目、相手の攻撃力 -4。",
    "icon": "change",
    "durability": 1,
    "type": "wearCostume",
    "values": [
      24
    ],
    "cost": 1,
    "price": 2,
    "size": 1,
    "locked": false,
    "usableOutOfBattle": true
  }
];
