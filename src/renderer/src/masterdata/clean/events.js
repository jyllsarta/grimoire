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
    "name": "逆さ吊りトラップ",
    "description": "デスサイズちゃんが足取り軽くダンジョンを歩いていると、突然足首に縄が巻きつき、吊り下げられてしまった！罠だ！慌ててスカートを押さえようとするも、その時に持っていた物を落としてしまうーー",
    "icon": "himitsu2",
    "cutin": "cutin11",
    "choiceIds": [
      111,
      112
    ]
  },
  {
    "id": 13,
    "kind": "misfortune",
    "characterId": -1,
    "name": "怪しいプール",
    "description": "デスサイズちゃんがウキウキでダンジョンを歩いていると、道が粘ついた深い水たまりで埋まっていた！ダンジョンの構造的に、回り道できないようだ。この怪しい水に浸かるしかない……",
    "icon": "himitsu3",
    "cutin": "",
    "choiceIds": [
      131,
      132,
      133
    ],
    "price": 3
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
