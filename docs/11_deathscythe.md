# 11 デスサイズちゃん (character 1) の本番想定仕様と実装対応

ユーザから 2026-09-26 に届いた本番想定仕様 (R3 と同時) と、それを 03 / 04 / 05 の構造に載せたときの type 設計。
「コアとなるアイデア」だけが決まった状態で、敵・パネル・レリックの物量はスプレッドシート上で編集していく (私が置いた数値は全部たたき台)。

## プロフィール (ユーザ記述)

- 敬語・寡黙・警戒
- 基本いい子で一応素直におにーさんを頼るが、おにーさんの下心は結構バレている
- えっちな経験が全くなく、わかりやすく赤面しキャパオーバーになりなすがまま
- 調子に乗ると暴走するタイプで、一度戦い出すとトリガーハッピー気味にぶんぶん鎌を振る
- 本気の戦闘経験はほぼなく、搦め手・罠・悪意に非常に弱い

## ダンジョン・パネルの設計方針 (ユーザ記述)

- 固有初期レリック「リーサルサイズ」とのシナジーをフルに活かせるダンジョンにし、リーサルサイズを発動しまくってサクサク敵を倒していく体験をさせる
  - 他キャラがダンジョンに挑むとリーサルサイズが使えず、ジャストリーサルも取りにくいため苦戦
- 本のルール: ジャストリーサルすると良性ステート「好調」を付与 (好調: 次の一回の通常攻撃のダメージ +2)
- 敵: シールド持ちが多い (貫通ダメージを与えるとリーサルサイズを効率よく狙える)
- 固有レリック: リーサルサイズの発動対象 HP +1 / 1 ターン目の通常攻撃に貫通を付与 / バトル開始時、自身に良性ステート「回避」を付与 (回避: 敵の次の通常攻撃 1 回を無効化。1 ターン中に複数回攻撃される場合、2 回目のやつは被弾する)
- 固有パネル: クナイ (アイテム: 使うと貫通 1 ダメージ、3 回) / クリティカルナイフ (武器: この武器で攻撃するターン、リーサルサイズの発動対象 HP +3) / クイックムーブ (アビリティ: 自身に回避を付与。敵を 3 体倒すと再使用可能)

## バトル設計 (ユーザ記述)

- 固有初期レリック **リーサルサイズ**: 行動後、敵の HP が 2 以下なら敵を倒す。この効果で倒した場合、ジャストリーサル扱いになる。「行動」はターン消費する通常攻撃とアビリティの使用・アイテムの使用のことを指す。専用のリーサルサイズ発動フラグメントがある
- 固有バステ 1 **結晶化**: バトル開始後、逃げられない (逃げるボタンの上に結晶化しているテクスチャを置く。素材は人間側が用意する)
- 固有バステ 2 **体温上昇**: 付与時、完全クロスブレイク状態になる。ステート所持中、クロスブレイクを修復できない (付与時に服を脱ぎ捨てちゃうので、ステート解除後も完全クロスブレイク状態を引き継ぐ)
- キャラ固有不利イベント **逆さ吊りトラップ**: デスサイズちゃんが足取り軽くダンジョンを歩いていると、突然足首に縄が巻きつき、吊り下げられてしまった！罠だ！慌ててスカートを押さえようとするも、その時に持っていた物を落としてしまうーー。2 択: リュックを落としちゃった (インベントリの武器・防具・アイテムを全て失う) / 財布を落としちゃった (コインを全て失う)
- 不利イベント **怪しいプール** (共通 SD 立ち絵 + 背景で表現できる): デスサイズちゃんがウキウキでダンジョンを歩いていると、道が粘ついた深い水たまりで埋まっていた！ダンジョンの構造的に、回り道できないようだ。この怪しい水に浸かるしかない……。沼は毒沼だった！ (毒 3) / 沼は媚薬沼だった！ (発情 3、追加で過酷さ +1) / キャラが羽を持っていて、インベントリ内の占有サイズが 4 以下の場合のみ選択可: 水溜まりを飛び越えた (被害なし。FTL の青選択肢と同じ)

## 実装対応 (M2)

### 語彙

| 仕様の語 | 内部キー | 置き場 |
|---|---|---|
| シールド (敵) | `enemy.shield` | 02 EnemyState。バトルをまたいで残る (HP と同じ)。`enemies.shield` が初期値、敵アクション `shield [n]` で増える。ブロックより先に削られ、貫通 (`pierceShield`) は素通り。ブロックは従来どおり 1 ラウンドで消える |
| 貫通ダメージ | `damageEnemy(n, { ignoreBlock: true, pierceShield: true })` | 03 動詞。プレイヤーの一撃は `strikeFlags` の `pierce` で両方無視。毒・自傷・リーサルサイズも両方無視。アイテム / アビリティの「直接ダメージ」はブロックだけ無視 (シールドは削る) |
| ジャストリーサル | ステップ `enemy.killed` (payload `just`) | 03。`damageEnemy` が HP を 0 以下にした瞬間に 1 回だけ発火。ちょうど 0 なら `just = true` → 標準処理 recharge(justLethal)。本のルールはここに登録 |
| 行動 (リーサルサイズの発火点) | `player.strike.after` (450) / `action.item` (100) / `action.ability` (100) | 03。装備の ON/OFF は行動ではない |
| 回避 | statuses `evade` (good, permanent, side=player) | 04。敵アクション `attack` が発火するステップ `enemy.attack.before` で 1 スタック消費して `payload.negated = true` にする。無効化された攻撃は防具摩耗・パリィ判定・眠り解除のどれにも関わらない |
| 好調 | statuses `focus` (good, permanent, values `[2]`) | 04。`attackPower` に +values[0] × スタック、`player.strike.after` (50) で全部消費 |
| 結晶化 | statuses `ds_crystal` (unique, characterId 1) | 04。許可 `canFlee` を不許可 (reason `crystal`)。app は `text.fleeOverlay` を見てテクスチャを置く (M3) |
| 体温上昇 | statuses `ds_fever` (unique, characterId 1) | 04。onApply で `setCostume("full", "unique")` (過酷さは statusHits で数え済みなので crossBreaks は増やさない)。許可 `canRepairCostume` を不許可。切れても costume は full のまま |
| リーサルサイズ | relics `lethalScythe [2]` (characterId 1) | 派生 `lethalThreshold` (base 0) に values[0] を寄与し、行動後に `enemy.hp <= lethalThreshold` なら `damageEnemy(hp, 貫通, tag=lethal)` で倒す (HP ちょうど 0 になるので `just`)。一発物 `lethalScythe` |
| 発動対象 HP +1 | relics `lethalThresholdPlus [1]` | 派生 `lethalThreshold` に +1 |
| 1 ターン目貫通 | relics `firstTurnPierce` | `battle.turn === 1` のとき `strikeFlags` に `pierce` |
| バトル開始時に回避 | relics `battleStartStatus [statusId, 量]` | `battle.start` (600) で applyStatus。汎用 |
| 固有初期レリック | `characters.startRelicIds` | 05。`run.start` (400) で所持。他キャラでは持たない |
| クナイ | items `pierceAttack [1]`、durability 3 | 貫通ダメージ (ブロック・シールド無視) |
| クリティカルナイフ | equipments passive `lethalThresholdPlus [3]` | ON の間、派生 `lethalThreshold` に +3 (「この武器で攻撃するターン」= ON にしているターン) |
| クイックムーブ | abilities `selfStatus [statusId, 量]`、rechargeType kill / 3 | 自分に回避 1 |
| 本のルール | bookRules `statusOnJustLethal [statusId, 量]` | `enemy.killed` で `just` なら applyStatus |
| 逆さ吊りトラップ | events 11 (misfortune, characterId 1, slot 1) | eventEffects `loseAllEntities` / `loseAllCoins` |
| 怪しいプール | events 13 (misfortune, characterId -1) | eventEffects `status` (value = statuses.id, value2 = 量) / `harshness [1]` (counters.harshness.bonus)。3 択目は `condition.type = wingsAndInventoryAtMost`, `condition.values = [4]` |
| 羽を持つ | `characters.wings` (boolean) | 05 |
| 条件付き選択肢 | `eventChoices.condition.type / condition.values` + family `choiceCondition` | 03。`chooseEvent` は条件を満たさないと reason `choiceLocked`。UI は query `choiceAvailable` で伏せる |

### マスタ (たたき台。ID は人間用の慣習)

- characters 1: hp 30 / power 3 / coins 2 / wings TRUE / startRelicIds [11] / initialEquipmentIds に 1011 (クリティカルナイフ) / initialItemIds に 2011 (クナイ) / initialAbilityIds に 3011 (クイックムーブ)。startAbilityIds は空 (固有パネルは山札で拾う)
- relics 11 リーサルサイズ (lethalScythe [2]) / 12 死神の目 (lethalThresholdPlus [1]) / 13 初太刀 (firstTurnPierce) / 14 身かわしの心得 (battleStartStatus [9, 1])。全部 characterId 1
- statuses 9 evade かいひ / 10 focus こうちょう [2] / 11 ds_crystal けっしょうか / 12 ds_fever たいおんじょうしょう
- equipments 1011 クリティカルナイフ (weapon, power 2, durability 3, passive lethalThresholdPlus [3])
- items 2011 クナイ (pierceAttack [1], durability 3)
- abilities 3011 クイックムーブ (selfStatus [9, 1], kill 3)
- bookRules 1 (book 1): statusOnJustLethal [10, 1]
- enemies: 31〜39 (シールド持ちの雑魚)、51〜54 (章のぬし。54 = 呪いの本体)、101〜104 (固有敵: 結晶のクモ / 結晶の女王 / ほてりのランプ / ほてりのぬし)。1〜4 は入替ダミー
- chapters 1〜3 + 4 (Extra)。章 2 に入替ダミーイベント 1 (= 逆さ吊り)、章 1 / 2 / 3 に 怪しいプール
- events 11 逆さ吊りトラップ / 13 怪しいプール。eventChoices 111 / 112 / 131 / 132 / 133

### 素材

- 立ち絵 `assets/characters/1/stand/` と SD `assets/characters/1/sd/` は本番素材 (`C:\Users\jyll\OneDrive\tale\1`, `\sd`) を `node tools/art_sync.js` でコピーする (09)
- SD の共通バステ (poison / sleep / paralyze / heart→arousal / nebaneba→sticky) はデスサイズちゃん規格で作ったが、今後全キャラで使い回す可能性大
- 結晶化の SD (`unique_ds_crystal.png`) は本番 (素材フォルダの `special1.png`。足元が結晶に包まれた全身差分)、体温上昇の SD (`unique_ds_fever.png`) も本番 (`special2.png`)。混乱 (`status_confusion.png`) と みずぎ (`costume_special1.png`) は未着。みずぎの仮は `base.png` のコピー (通常衣装のまま)
- 結晶化中は固有バステの規則 (04、R1 Q23「固有バステが衣装状態をマスクする」) で衣装レイヤーが `unique_ds_crystal` に置き換わるので、半壊 / 全壊でも SD は通常衣装の見た目になる (結晶化の全身差分は通常衣装で描かれている)。これは仕様通りで、衣装ごとの差分は要らない
- 逆さ吊りのカットイン (`grimoire_scenes/cutin11.png`)、各種スキット用スチルは未着 (仮素材で進める)

## 未決 (R4 で聞く)

- ~~SD の `special2.png` は何の衣装か~~ → 体温上昇の SD (2026-09-26 回答)
- 回避が消費されずに残ったとき (敵が攻撃してこなかった)、次のバトルへ持ち越すか。いまは良性ステートの規則どおり章のあいだ残り、次のバトル開始でレリック分がさらに +1 される
- 好調が 2 スタック以上のとき、次の一撃で全部消費 (+2 × スタック) にした。1 スタックずつ消費が望みなら変える
- 体温上昇の付与で衣装が full になった分は過酷さ (crossBreaks) に数えていない (statusHits で 1 回数えるので二重にしない)
- 怪しいプールは「共通 SD で表現できる」ので characterId = -1 (全ヒロイン共通の不利イベント) として章に直接置いた。キャラ固有 (slot 2) にしたければ events の characterId / slot を変えるだけ
