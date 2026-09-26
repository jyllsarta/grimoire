// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 111,
    "label": "リュックを落としちゃった",
    "resultText": "リュックが暗闇に落ちていった。武器・防具・アイテムを全部失った。",
    "effects": [
      {
        "type": "loseAllEntities"
      }
    ]
  },
  {
    "id": 112,
    "label": "財布を落としちゃった",
    "resultText": "財布が暗闇に落ちていった。コインを全部失った。",
    "effects": [
      {
        "type": "loseAllCoins"
      }
    ]
  },
  {
    "id": 131,
    "label": "浸かる (毒沼だった！)",
    "resultText": "沼は毒沼だった！ どく 3。",
    "effects": [
      {
        "type": "status",
        "value": 1,
        "value2": 3
      }
    ]
  },
  {
    "id": 132,
    "label": "浸かる (媚薬沼だった！)",
    "resultText": "沼は媚薬沼だった！ はつじょう 3、過酷さ +1。",
    "effects": [
      {
        "type": "status",
        "value": 4,
        "value2": 3
      },
      {
        "type": "harshness",
        "value": 1
      }
    ]
  },
  {
    "id": 133,
    "label": "水溜まりを飛び越えた",
    "resultText": "羽ばたいて飛び越えた。被害なし。",
    "effects": [],
    "condition": {
      "type": "wingsAndInventoryAtMost",
      "values": [
        4
      ]
    }
  },
  {
    "id": 9011,
    "label": "あけてみる",
    "resultText": "コインがざくざく出てきた！",
    "effects": [
      {
        "type": "coins",
        "value": 5
      }
    ]
  },
  {
    "id": 9012,
    "label": "そっとしておく",
    "resultText": "箱はしずかに消えていった。",
    "effects": []
  }
];
