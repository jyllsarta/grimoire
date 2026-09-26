// このファイルは tools/import.js が data/*.csv から生成する。直接編集しない (次の import で上書きされる)。
export default [
  {
    "id": 1,
    "characterId": 0,
    "key": "opening",
    "type": "talk",
    "trigger": "opening",
    "name": "はじまり",
    "releaseByLose": false,
    "order": 1
  },
  {
    "id": 2,
    "characterId": 1,
    "key": "bookStart",
    "type": "talk",
    "trigger": "bookStart",
    "name": "本のはじまり",
    "releaseByLose": false,
    "order": 2
  },
  {
    "id": 3,
    "characterId": 1,
    "key": "bossBefore",
    "type": "talk",
    "trigger": "bossBefore",
    "name": "ぬしの気配",
    "releaseByLose": false,
    "order": 3
  },
  {
    "id": 4,
    "characterId": 1,
    "key": "bookClear",
    "type": "talk",
    "trigger": "bookClear",
    "name": "最後のページ",
    "releaseByLose": false,
    "order": 4
  },
  {
    "id": 5,
    "characterId": 1,
    "key": "extraStart",
    "type": "talk",
    "trigger": "extraStart",
    "name": "呪いの正体",
    "releaseByLose": false,
    "order": 5
  },
  {
    "id": 6,
    "characterId": 1,
    "key": "happyEnd",
    "type": "scene",
    "trigger": "happyEnd",
    "name": "ハッピーエンド",
    "releaseByLose": false,
    "order": 6
  },
  {
    "id": 7,
    "characterId": 1,
    "key": "normalEnd",
    "type": "scene",
    "trigger": "normalEnd",
    "name": "ノーマルエンド",
    "releaseByLose": false,
    "order": 7
  },
  {
    "id": 8,
    "characterId": 1,
    "key": "lose",
    "type": "scene",
    "trigger": "lose",
    "name": "敗北",
    "releaseByLose": true,
    "order": 8
  }
];
