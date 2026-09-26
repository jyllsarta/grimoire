// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 1,
    "characterId": -1,
    "name": "でっかいカバン",
    "description": "インベントリ容量 +2。",
    "icon": "backpack",
    "rarity": 1,
    "price": 5,
    "crownPrice": 0,
    "type": "slotPlus",
    "values": [
      2
    ],
    "locked": false
  },
  {
    "id": 2,
    "characterId": -1,
    "name": "パワーカプセル",
    "description": "基礎こうげき +1。",
    "icon": "adrenaline",
    "rarity": 3,
    "price": 0,
    "crownPrice": 2,
    "type": "basePowerPlus",
    "values": [
      1
    ],
    "locked": false
  },
  {
    "id": 3,
    "characterId": -1,
    "name": "チョバムアーマー",
    "description": "最大ライフ +10 (手に入れたときライフも +10)。",
    "icon": "life",
    "rarity": 1,
    "price": 5,
    "crownPrice": 0,
    "type": "maxHpPlus",
    "values": [
      10
    ],
    "locked": false
  },
  {
    "id": 4,
    "characterId": -1,
    "name": "無限わかめ",
    "description": "毎ターン終了時、ライフ +1。",
    "icon": "infinity",
    "rarity": 3,
    "price": 0,
    "crownPrice": 2,
    "type": "healEachTurn",
    "values": [
      1
    ],
    "locked": false
  },
  {
    "id": 5,
    "characterId": -1,
    "name": "ゾルタンシールド",
    "description": "毎バトル、シールド 5 を持って開始。",
    "icon": "barrier",
    "rarity": 3,
    "price": 0,
    "crownPrice": 2,
    "type": "battleStartShield",
    "values": [
      5
    ],
    "locked": false
  },
  {
    "id": 6,
    "characterId": -1,
    "name": "トゲトゲ",
    "description": "ON の武器 1 本ごとに攻撃力 +1。",
    "icon": "kama",
    "rarity": 1,
    "price": 5,
    "crownPrice": 0,
    "type": "weaponAttack",
    "values": [
      1
    ],
    "locked": false
  },
  {
    "id": 11,
    "characterId": 1,
    "name": "リーサルサイズ",
    "description": "行動のあと、敵のライフが 2 以下なら倒す。この倒し方はジャストリーサルになる。デスサイズちゃんの初期レリック。",
    "icon": "kama",
    "rarity": 1,
    "price": 0,
    "crownPrice": 0,
    "type": "lethalScythe",
    "values": [
      2
    ],
    "locked": false
  },
  {
    "id": 12,
    "characterId": 1,
    "name": "死神の目",
    "description": "リーサルサイズの発動対象ライフ +1。",
    "icon": "througheyes",
    "rarity": 2,
    "price": 6,
    "crownPrice": 1,
    "type": "lethalThresholdPlus",
    "values": [
      1
    ],
    "locked": false
  },
  {
    "id": 13,
    "characterId": 1,
    "name": "初太刀",
    "description": "バトル 1 ターン目のこうげきが貫通になる (ブロックもシールドも無視)。",
    "icon": "flash",
    "rarity": 1,
    "price": 5,
    "crownPrice": 0,
    "type": "firstTurnPierce",
    "values": [],
    "locked": false
  },
  {
    "id": 14,
    "characterId": 1,
    "name": "身かわしの心得",
    "description": "バトル開始時、かいひ 1 を得る。",
    "icon": "feather",
    "rarity": 2,
    "price": 6,
    "crownPrice": 1,
    "type": "battleStartStatus",
    "values": [
      9,
      1
    ],
    "locked": false
  }
];
