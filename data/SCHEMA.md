# マスターデータ スキーマ (生成物)

`node tools/gen_schema.js` が core/effects のレジストリと core/master/tables.js から生成する。**手書きしない**。
記法とパイプラインは docs/05_masterdata.md、値の意味は各効果モジュールのコメントが正。

## テーブルと列

| テーブル | 列 |
|---|---|
| config (1 行) | title:string, startSlots:integer, maxSlots:integer, shopSlots:integer, rerollPrice:integer, harshnessWeightMisfortune:integer, harshnessWeightStatus:integer |
| characters | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, key:string, name:string, asKnownAs:string, description:string, hp:integer, power:integer, coins:integer, imageId:integer, bgmId:string, order:integer, initialEquipmentIds:intarray, initialItemIds:intarray, initialAbilityIds:intarray, startEquipmentIds:intarray, startItemIds:intarray, startAbilityIds:intarray |
| books | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, name:string, description:string, order:integer, chapterIds:intarray, extraChapterId:integer, harshnessThreshold:integer, bgmId:string, coverImage:string, skin:string |
| bookRules | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, bookId:integer, key:string, values:intarray, name:string, description:string, icon:string |
| chapters | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, name:string, description:string, width:integer, healPrice:integer, clearJewelBonus:integer, clearCrownBonus:integer, enemyIds:intarray, bossEnemyId:integer, equipmentIds:intarray, itemIds:intarray, abilityIds:intarray, eventIds:intarray, battleBg:string, bgmId:string |
| enemies | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, kind:string, slot:integer, characterId:integer, name:string, description:string, icon:string, reward:integer, hp:integer |
| enemyActions | _skip:boolean, _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, enemyId:integer, order:integer, name:string, actions[i].{type:string, value:integer} |
| equipments | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, name:string, description:string, icon:string, category:string, durability:integer, power:integer, block:integer, cost:integer, price:integer, size:integer, passive.{type:string, values:intarray}, locked:boolean |
| items | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, name:string, description:string, icon:string, durability:integer, type:string, values:intarray, cost:integer, price:integer, size:integer, locked:boolean, usableOutOfBattle:boolean |
| abilities | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, name:string, description:string, icon:string, type:string, values:intarray, cost:integer, price:integer, size:integer, durability:integer, rechargeType:string, rechargeValue:integer, locked:boolean |
| relics | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, name:string, description:string, icon:string, rarity:integer, price:integer, crownPrice:integer, type:string, values:intarray, locked:boolean |
| statuses | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, key:string, kind:string, polarity:string, side:string, duration:string, characterId:integer, name:string, description:string, icon:string, sdLayer:string, effect:string, values:intarray, next:string, order:integer |
| events | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, kind:string, slot:integer, characterId:integer, name:string, description:string, icon:string, cutin:string, choiceIds:intarray, price:integer |
| eventChoices | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, label:string, resultText:string, effects[i].{type:string, value:integer} |
| starNodes | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, kind:string, x:integer, y:integer, fromIds:intarray, effectType:string, values:intarray, delta:integer, gateType:string, gateValue:integer, name:string, description:string |
| starPresets | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, difficulty:string, nodeIds:intarray, name:string, description:string |
| skits | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, key:string, type:string, trigger:string, name:string, releaseByLose:boolean, order:integer |
| skitLines | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, skitId:integer, order:integer, speaker:string, faceId:integer, text:string, imageId:integer, soundId:string |
| characterScripts | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, characterId:integer, key:string, faceId:integer, message:string, order:integer |
| systemTexts | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, key:string, text:string |
| tips | _isTrial:integer, _isCien:integer, _isClean:integer, key:string, title:string, body:string |
| credits | _isTrial:integer, _isCien:integer, _isClean:integer, id:integer, section:string, name:string, url:string, order:integer |

メタ列: `_skip` (TRUE の行は出力しない)、`_isTrial` / `_isCien` / `_isClean` (空/1 = 常に出力、2 = そのフラグで除外、3 = そのフラグのときだけ)。ロケール列は `列名-ロケール` (例 `name-en_us`)。

## 効果の type 一覧 (レジストリ順 = 同 order の同点解決の順)

### status — statuses.effect (省略時 key)。kind=common|unique|buff

| type | values | refs | 登録先 |
|---|---|---|---|
| `poison` | (なし) | - | hook player.tick@500, hook enemy.act.begin@600 |
| `sleep` | (なし) | - | hook player.damaged@100, permission canAct@100, permission canActivateEquipment@100, permission canUseAbility@100, permission canUseItem@100 |
| `paralyze` | (なし) | - | permission canActivateEquipment@200, onApply |
| `arousal` | (なし) | - | permission canUseAbility@200 |
| `sticky` | (なし) | - | turnOrder (flat@200) |
| `confusion` | (なし) | - | hook turn.start@100, onApply, onExpire |
| `power` | (なし) | - | attackPower (flat@300) |
| `abilityDamage` | (なし) | - | abilityDamage (flat@300) |
| `powerDelta` | (なし) | - | attackPower (flat@350), enemyAttack (flat@350) |
| `blockDelta` | (なし) | - | blockValue (flat@350) |
| `ds_unique1` | (なし) | - | attackPower (flat@450) |
| `ds_unique2` | (なし) | - | enemyAttack (flat@450) |

### costume — statuses.effect (省略時 key)。kind=costume

| type | values | refs | 登録先 |
|---|---|---|---|
| `normal` | (なし) | - | - |
| `half` | (なし) | - | attackPower (flat@400) |
| `full` | (なし) | - | attackPower (flat@400), enemyAttack (flat@400) |
| `special1` | [0] amount: int ≥ 0 | - | enemyAttack (flat@400) |

### bookRule — bookRules.key

| type | values | refs | 登録先 |
|---|---|---|---|
| `armorForbidden` | (なし) | - | permission canActivateEquipment@300 |
| `weaponCostPlus` | [0] amount: int ≥ 1 | - | panelCost (flat@300) |

### passive — equipments.passive.type

| type | values | refs | 登録先 |
|---|---|---|---|
| `pierce` | (なし) | - | strikeFlags (flat@300) |
| `drain` | [0] multiplier: int ≥ 1 | - | hook player.strike.after@300 |
| `poison` | [0] stack: int ≥ 1 | - | hook player.strike.after@400 |

### relic — relics.type

| type | values | refs | 登録先 |
|---|---|---|---|
| `healEachTurn` | [0] amount: int ≥ 1 | - | hook turn.end@300 |
| `maxHpPlus` | [0] amount: int ≥ 1 | - | maxHp (flat@300) |
| `slotPlus` | [0] slots: int ≥ 1 | - | slotCount (flat@300) |
| `basePowerPlus` | [0] amount: int ≥ 1 | - | basePower (flat@300) |
| `battleStartShield` | [0] amount: int ≥ 1 | - | battleStartShield (flat@300) |
| `weaponAttack` | [0] amount: int ≥ 1 | - | attackPower (flat@320) |

### star — starNodes.effectType

| type | values | refs | 登録先 |
|---|---|---|---|
| `maxHpPlus` | [0] amount: int ≥ 1 | - | maxHp (flat@200) |
| `maxHpMinus` | [0] amount: int ≥ 1 | - | maxHp (flat@200) |
| `powerPlus` | [0] amount: int ≥ 1 | - | basePower (flat@200) |
| `powerMinus` | [0] amount: int ≥ 1 | - | basePower (flat@200) |
| `slotPlus` | [0] amount: int ≥ 1 | - | slotCount (flat@200) |
| `slotMinus` | [0] amount: int ≥ 1 | - | slotCount (flat@200) |
| `enemyHpPlus` | [0] amount: int ≥ 1 | - | enemyMaxHp (flat@200) |
| `enemyHpMinus` | [0] amount: int ≥ 1 | - | enemyMaxHp (flat@200) |
| `startHpMinus` | [0] amount: int ≥ 1 | - | startHp (final@200) |
| `badDurationPlus` | [0] amount: int ≥ 1 | - | statusValue (flat@200) |
| `startRelic` | [0] relicId: int | [0] → relics.id | hook run.start@100 |
| `startEquipment` | [0] id: int | [0] → equipments.id | list startEntities@200 |
| `startItem` | [0] id: int | [0] → items.id | list startEntities@200 |
| `startAbility` | [0] id: int | [0] → abilities.id | list startEntities@200 |

### item — items.type

| type | values | refs | 登録先 |
|---|---|---|---|
| `instantHeal` | [0] amount: int ≥ 1 | - | use |
| `attack` | [0] damage: int ≥ 1 | - | use |
| `shield` | [0] amount: int ≥ 1 | - | use |
| `wearCostume` | [0] statusId: int | [0] → statuses.id | use |

### ability — abilities.type

| type | values | refs | 登録先 |
|---|---|---|---|
| `attack` | [0] damage: int ≥ 1 | - | use |
| `block` | [0] block: int ≥ 1 | - | use |

### enemyAction — enemyActions.actions[i].type (statuses.key (common|unique) も書ける: value = 量)

| type | values | refs | 登録先 |
|---|---|---|---|
| `attack` | [0] damage: int ≥ 0 | - | use |
| `block` | [0] block: int ≥ 0 | - | use |
| `rest` | (なし) | - | use |
| `selfHarm` | [0] damage: int ≥ 1 | - | use |
| `pierce` | (なし) | - | enemyStrikeFlags (flat@200), use |
| `blitz` | (なし) | - | turnOrder (flat@100), use |
| `crossBreak` | (なし) | - | use |

### eventEffect — eventChoices.effects[i].type (value は 1 個)

| type | values | refs | 登録先 |
|---|---|---|---|
| `coins` | [0] amount: int | - | use |
| `hp` | [0] amount: int | - | use |
| `gainEquipment` | [0] id: int | [0] → equipments.id | use |
| `gainItem` | [0] id: int | [0] → items.id | use |
| `gainAbility` | [0] id: int | [0] → abilities.id | use |
| `status` | [0] statusId: int | [0] → statuses.id | use |
| `crossBreak` | (なし) | - | use |

## ステップと標準処理の order

| ステップ | 標準処理 (order) | 次 |
|---|---|---|
| `run.start` | initialize (500) | (コマンド内で同期) |
| `chapter.build` | buildBoard (500) | (コマンド内で同期) |
| `chapter.start` | - | (コマンド内で同期) |
| `panel.taken` | - | (コマンド内で同期) |
| `panel.dumped` | - | (コマンド内で同期) |
| `entity.gained` | - | (コマンド内で同期) |
| `entity.spent` | recharge (500) | (コマンド内で同期) |
| `event.resolved` | harshness (500) | (コマンド内で同期) |
| `chapter.clear` | rewards (500), reset (600), decideNext (700) | (コマンド内で同期) |
| `intermission.enter` | - | (コマンド内で同期) |
| `intermission.leave` | - | (コマンド内で同期) |
| `action.item` | - | (コマンド内で同期) |
| `action.ability` | count (500) | (コマンド内で同期) |
| `action.equipToggle` | - | (コマンド内で同期) |
| `player.damaged` | - | (コマンド内で同期) |
| `enemy.damaged` | - | (コマンド内で同期) |
| `run.end` | - | (コマンド内で同期) |
| `battle.start`  | create (500) | 03 の表 |
| `turn.start`  | fireDelayed (500) | 03 の表 |
| `select` (入力待ち) | - | 03 の表 |
| `turn.command`  | command (500) | 03 の表 |
| `player.tick` (settle) | statusTick (500) | 03 の表 |
| `turn.order`  | order (500) | 03 の表 |
| `player.strike.before`  | - | 03 の表 |
| `player.strike`  | strike (500) | 03 の表 |
| `player.strike.after`  | weaponWear (500) | 03 の表 |
| `player.act.skipped`  | sleepSkip (500) | 03 の表 |
| `player.act.end` (settle) | statusDecay (500), buffsTick (600) | 03 の表 |
| `enemy.act.begin` (settle) | blockReset (500), enemyStatusTick (600) | 03 の表 |
| `enemy.stunned` (settle) | unstun (500), enemyBuffsTick (600), enemyStatusDecay (650), routineAdvance (700) | 03 の表 |
| `enemy.action`  | resolve (500) | 03 の表 |
| `enemy.act.after` (settle) | armorWear (200), parry (300), enemyBuffsTick (500), enemyStatusDecay (550), routineAdvance (600) | 03 の表 |
| `turn.end`  | advance (500), recharge (600) | 03 の表 |
| `flee.command`  | command (500) | 03 の表 |
| `flee.done`  | done (500) | 03 の表 |
| `battle.victory`  | reward (100), rechargeKill (200), rechargeTurn (300), boardUpdate (500) | 03 の表 |
| `battle.defeat`  | lose (500) | 03 の表 |
| `battle.end` (終端) | clear (500) | 03 の表 |

## 派生値 / 許可 / 派生リスト

- 派生値: `maxHp` (number), `startHp` (number), `basePower` (number), `attackPower` (number), `strikeFlags` (flags), `enemyStrikeFlags` (flags), `abilityDamage` (number), `statusValue` (number), `blockValue` (number), `enemyAttack` (number), `enemyMaxHp` (number), `turnOrder` (choice), `slotCount` (number), `panelCost` (number), `killReward` (number), `chapterCoin` (number), `jewelGain` (number), `crownGain` (number), `healPrice` (number), `rerollPrice` (number), `battleStartShield` (number), `harshnessScore` (number)
- 許可: `canActivateEquipment`, `canUseAbility`, `canUseItem`, `canAct`, `canApplyStatus`
- 派生リスト: `startEntities`, `chapterPanelSpecs`, `shopCandidates`

## テストデータの約束

「先頭が 9 で既存と桁が違う ID」はテストデータとして自由に追加・変更してよい。enemyActions は敵 1 体につき 4 行 (order 1..4、id = 敵 id × 10 + order)、使わない行は `_skip`。ID 空間の分割は人間の認知用で、ロジックは ID の値で分岐しない。
