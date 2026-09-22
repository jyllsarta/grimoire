// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 111,
    "label": "いたた…",
    "resultText": "転んで衣装がやぶれた。ライフ -2。",
    "effects": [
      {
        "type": "hp",
        "value": -2
      },
      {
        "type": "crossBreak",
        "value": 0
      }
    ]
  },
  {
    "id": 121,
    "label": "むりに引きぬく",
    "resultText": "鎌は抜けたが衣装がやぶれた。",
    "effects": [
      {
        "type": "crossBreak",
        "value": 0
      }
    ]
  },
  {
    "id": 122,
    "label": "あきらめて置いていく",
    "resultText": "コイン -2 で人に頼んだ。",
    "effects": [
      {
        "type": "coins",
        "value": -2
      }
    ]
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
