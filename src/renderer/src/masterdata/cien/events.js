// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 1,
    "kind": "placeholder",
    "slot": 1,
    "name": "入替ダミーイベント 1",
    "description": "挑戦中ヒロインの固有イベント 1 に置き換わる。",
    "icon": "himitsu",
    "cutin": "",
    "choiceIds": []
  },
  {
    "id": 2,
    "kind": "placeholder",
    "slot": 2,
    "name": "入替ダミーイベント 2",
    "description": "挑戦中ヒロインの固有イベント 2 に置き換わる。",
    "icon": "himitsu",
    "cutin": "",
    "choiceIds": []
  },
  {
    "id": 11,
    "kind": "misfortune",
    "slot": 1,
    "characterId": 1,
    "name": "つまずいた",
    "description": "デスサイズちゃんのドジ (仮)。",
    "icon": "himitsu2",
    "cutin": "cutin11",
    "choiceIds": [
      111
    ]
  },
  {
    "id": 12,
    "kind": "misfortune",
    "slot": 2,
    "characterId": 1,
    "name": "鎌がひっかかった",
    "description": "デスサイズちゃんの不運 (仮)。",
    "icon": "himitsu3",
    "cutin": "cutin12",
    "choiceIds": [
      121,
      122
    ]
  },
  {
    "id": 901,
    "kind": "normal",
    "characterId": -1,
    "name": "ふしぎなおくりもの",
    "description": "リボンのかかった箱がぽつんと置いてある。あけてみる？",
    "icon": "gift",
    "cutin": "",
    "choiceIds": [
      9011,
      9012
    ]
  }
];
