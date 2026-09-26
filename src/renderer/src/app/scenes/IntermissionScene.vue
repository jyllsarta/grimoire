<template>
  <div class="intermission scene">
    <div class="scene_bg dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>
    <div class="im_figure"><CharacterFigure :character-id="state.characterId" follow-talk /></div>

    <div v-hover-se class="im_dialog panel_glass orn_frame pop_in">
      <div class="im_head">
        <Ornament kind="head" :title="T('intermission.heading')" class="im_title" />
        <span class="hint">{{ T("intermission.chapterCleared", { name: clearedChapter.name }) }}</span>
        <div class="im_wallet">
          <span class="stat_chunk jewel_chunk" data-tips="jewel"
            ><Shape kind="coin" :text="null" size="small" /><span class="value">{{ state.wallet.jewel }}</span
            ><span class="hint">{{ T("intermission.jewel") }}</span></span
          >
          <span class="stat_chunk crown_chunk" data-tips="crown"
            ><img :src="CROWN_ICON" alt="" /><span class="value">{{ state.wallet.crown }}</span
            ><span class="hint">{{ T("intermission.crown") }}</span></span
          >
        </div>
      </div>
      <div v-if="state.progress.stage === 'extra'" class="im_extra_note">{{ T("intermission.extraNote") }}</div>

      <div class="im_body">
        <!-- 左: 次の章 -->
        <div class="im_col im_next">
          <div class="col_head">{{ T("intermission.next") }}</div>
          <template v-if="nextChapter">
            <div class="next_name">{{ nextChapter.name }}</div>
            <div class="next_desc hint">{{ nextChapter.description }}</div>
            <div class="preview_list no_scrollbar">
              <div v-for="p in preview" :key="p.key" class="preview_row" :data-desc="p.desc">
                <img class="icon_img" :src="p.icon" alt="" /><span class="pv_name">{{ p.name }}</span
                ><span class="pv_count hint">×{{ p.count }}</span>
              </div>
              <div class="preview_row boss" :data-desc="`enemy:${nextChapter.bossEnemyId}`">
                <img class="icon_img" :src="iconPath(master.get('enemies', nextChapter.bossEnemyId).icon)" alt="" /><span class="pv_name">{{
                  master.get("enemies", nextChapter.bossEnemyId).name
                }}</span
                ><span class="pv_count hint">{{ T("ingame.boss") }}</span>
              </div>
            </div>
            <div v-if="rules.length" class="next_rules" data-tips="bookRule">
              <span v-for="r in rules" :key="r.id" class="chip" :title="r.description"
                ><img class="icon_img" :src="iconPath(r.icon)" alt="" />{{ r.name }}</span
              >
            </div>
          </template>
        </div>

        <!-- 中: ショップ -->
        <div class="im_col im_shop">
          <div class="col_head">
            {{ T("intermission.shop") }}<span class="hint">{{ T("intermission.rerolls", { n: state.shop.rerolls }) }}</span>
          </div>
          <div class="shop_grid no_scrollbar">
            <div
              v-for="(slot, i) in state.shop.slots"
              :key="i"
              class="shop_card"
              :class="[`k_${slot.kind}`, { sold: slot.soldOut, rare: slot.rare, cannot: !canAfford(slot) }]"
              :data-desc="`${slot.kind}:${slot.defId}`"
              @click="buy(i)"
            >
              <span v-if="slot.rare" class="rare_ribbon">RARE</span>
              <img class="icon_img shop_icon" :src="iconPath(slotDef(slot).icon)" alt="" />
              <div class="shop_info">
                <div class="shop_name">{{ slotDef(slot).name }}</div>
                <div class="shop_kind hint">
                  {{ slotKind(slot) }}<span v-if="slot.kind === 'relic'" class="rarity">{{ "★".repeat(slotDef(slot).rarity || 1) }}</span>
                </div>
              </div>
              <div class="shop_price">
                <template v-if="slot.soldOut"
                  ><span class="sold_text">{{ T("intermission.soldOut") }}</span></template
                >
                <template v-else>
                  <span class="price_j">{{ slotPrice(slot).jewel }}</span>
                  <span v-if="slotPrice(slot).crown" class="price_c">+{{ slotPrice(slot).crown }}<img :src="CROWN_ICON" alt="" /></span>
                </template>
              </div>
            </div>
          </div>
          <div class="shop_foot">
            <button class="btn sub small" :class="{ cannot: state.wallet.jewel < rerollPrice }" @click="cmd('rerollShop')">
              {{ T("intermission.reroll", { n: rerollPrice }) }}
            </button>
          </div>
        </div>

        <!-- 右: ライフと持ち物 -->
        <div class="im_col im_self">
          <div class="col_head">{{ T("intermission.life") }}</div>
          <div class="life_line">
            <span class="value">{{ state.player.hp }}</span
            ><span class="hint">/ {{ maxHp }}</span>
          </div>
          <HpDots :hp="state.player.hp" :max="maxHp" />
          <StatusChips
            class="im_chips"
            :statuses="state.player.statuses"
            :unique="state.player.unique"
            :costume="state.player.costume"
            size="small"
          />
          <button
            class="btn sub small heal_btn"
            :class="{ cannot: state.wallet.jewel < healPrice || state.player.hp >= maxHp }"
            @click="cmd('buyHeal')"
          >
            {{ T("intermission.heal", { n: healPrice }) }}
          </button>
          <div class="relic_line" data-tips="relic">
            <div
              v-for="r in state.relics"
              :key="r.uid"
              class="relic_icon"
              :title="master.get('relics', r.defId).name"
              :data-desc="`relic:${r.defId}`"
            >
              <img class="icon_img" :src="iconPath(master.get('relics', r.defId).icon)" alt="" />
            </div>
          </div>
          <div class="col_head inv_head">
            {{ T("inventory.heading") }}<span class="hint">{{ T("intermission.invHint") }}</span>
          </div>
          <InventoryStrip
            :entities="state.inventory.entities"
            :slot-count="slotCount"
            :strip-w="330"
            :cell-h="70"
            :concealed="state.inventory.concealed"
            draggable
            @ent-click="onEntClick"
            @drop="onDrop"
          />
          <button class="btn sub small" @click="organize">{{ T("inventory.organize") }}</button>
        </div>
      </div>

      <div v-if="message" class="im_message hint">{{ message }}</div>
      <div class="im_foot">
        <button class="btn sub mini" @click="giveUp">{{ T("intermission.abandon") }}</button>
        <button class="btn big go_btn" @click="go">{{ T("intermission.go") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 幕間 (07 Intermission、tale の 1180x660 ダイアログ): 次章の山札公開 / ショップ (レア枠にリボン) / 回復 / 整理 / 非戦闘アイテム / 出発
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { useTalkStore } from "../stores/talk.js";
import { master } from "@core/master/index.js";
import { q, currentChapter, nextChapterId } from "@core/queries/index.js";
import { defOf } from "@core/domain/entity.js";
import { slotPrice } from "@core/domain/shop.js";
import { T, reasonText } from "../text.js";
import { iconPath, kindLabel, CROWN_ICON } from "../ui/entity_view.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";
import HpDots from "../components/HpDots.vue";
import StatusChips from "../components/StatusChips.vue";
import InventoryStrip from "../components/InventoryStrip.vue";

const session = useSessionStore();
const run = useRunStore();
const talk = useTalkStore();
const state = computed(() => run.state);
const qq = computed(() => q(run.state));
const message = ref("");
const clearedChapter = computed(() => currentChapter(run.state));
const nextId = computed(() => nextChapterId(run.state));
const nextChapter = computed(() => (nextId.value ? master.get("chapters", nextId.value) : null));
const rules = computed(() => master.where("bookRules", "bookId", run.state.bookId));
const maxHp = computed(() => qq.value.derive("maxHp"));
const slotCount = computed(() => qq.value.derive("slotCount"));
const healPrice = computed(() => qq.value.derive("healPrice"));
const rerollPrice = computed(() => qq.value.derive("rerollPrice"));
const preview = computed(() => {
  if (!nextId.value) return [];
  const specs = qq.value.ctx.list("chapterPanelSpecs", { chapterId: nextId.value });
  const map = new Map();
  for (const s of specs) {
    const key = `${s.kind}:${s.defId}`;
    if (!map.has(key))
      map.set(key, { key, desc: key, kind: s.kind, name: defOf(s.kind, s.defId).name, icon: iconPath(defOf(s.kind, s.defId).icon), count: 0 });
    map.get(key).count += 1;
  }
  const ORDER = { enemy: 0, event: 1, equipment: 2, item: 3, ability: 4 };
  return [...map.values()].sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.name.localeCompare(b.name, "ja"));
});

onMounted(() => {
  session.setBgm("shop");
  talk.bind(run.state.characterId);
  talk.say("intermission", { hop: true });
});

const slotDef = (slot) => defOf(slot.kind, slot.defId);
const slotKind = (slot) => (slot.kind === "event" ? T("panel.misfortuneSub") : kindLabel(slot.kind));
function canAfford(slot) {
  const p = slotPrice(slot);
  return run.state.wallet.jewel >= p.jewel && run.state.wallet.crown >= p.crown;
}
function cmd(name, args) {
  const r = run.dispatch(name, args);
  if (!r.ok) {
    SoundManager.playSe("ng");
    message.value = reasonText(r.reason);
  } else message.value = "";
  return r;
}
function buy(i) {
  const slot = run.state.shop.slots[i];
  if (slot.soldOut) return;
  const r = cmd("buyShopSlot", { index: i });
  if (r.ok) talk.say("buy", { hop: true });
}
function onEntClick(e) {
  if (e.kind !== "item") return;
  const r = cmd("useItem", { uid: e.uid });
  if (r.ok) talk.say("itemUse");
}
function onDrop(e, pos) {
  if (pos == null) return;
  const arrangement = run.state.inventory.entities.map((x) => ({ uid: x.uid, pos: x.uid === e.uid ? pos : x.pos }));
  const r = run.dispatch("arrangeInventory", { arrangement });
  SoundManager.playSe(r.ok ? "equip" : "ng");
}
function organize() {
  SoundManager.playSe("open");
  session.openDialog("organize", { mode: "plain" });
}
async function giveUp() {
  const yes = await session.openDialog("confirm", { text: T("intermission.abandonConfirm"), danger: true });
  if (yes) cmd("giveUp");
}
function go() {
  SoundManager.playSe("gameStart");
  cmd("enterNextChapter");
}
</script>

<style lang="scss" scoped>
.intermission {
  overflow: hidden;
  .im_figure {
    position: absolute;
    left: 900px;
    top: -40px;
    width: 640px;
    height: 960px;
    pointer-events: none;
    opacity: 0.55;
  }
  .im_dialog {
    position: absolute;
    left: 50px;
    top: 30px;
    width: 1180px;
    height: 660px;
    padding: 22px 30px;
    display: flex;
    flex-direction: column;
    z-index: 2;
  }
  .im_head {
    display: flex;
    align-items: center;
    gap: 18px;
    padding-right: 190px; // 右上の常駐ボタン (音量 / 高速化) を避ける
    .im_title {
      width: 260px;
    }
    .im_wallet {
      margin-left: auto;
      display: flex;
      gap: 22px;
    }
  }
  .im_extra_note {
    margin-top: 6px;
    color: var(--color-negative1);
    font-size: var(--font-size-small);
  }
  .im_body {
    margin-top: 14px;
    flex: 1;
    display: flex;
    gap: 16px;
    min-height: 0;
  }
  .im_col {
    border-radius: var(--radius-panel);
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--color-base3);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    .col_head {
      color: var(--color-main1);
      font-size: var(--font-size-small);
      letter-spacing: 0.1em;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      white-space: nowrap;
      .hint {
        white-space: normal;
        letter-spacing: 0;
        text-align: right;
      }
    }
  }
  .im_next {
    width: 300px;
    .next_name {
      margin-top: 8px;
      color: var(--color-white0);
      font-size: var(--font-size-normal);
    }
    .next_desc {
      white-space: normal;
      line-height: 1.5;
      margin-top: 2px;
    }
    .preview_list {
      margin-top: 10px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .preview_row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 8px;
      border-radius: var(--radius-card);
      background: rgba(0, 0, 0, 0.25);
      font-size: var(--font-size-small);
      cursor: context-menu;
      img {
        width: 24px;
        height: 24px;
      }
      .pv_name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      &.boss {
        border: 1px solid var(--color-negative2);
      }
    }
    .next_rules {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      img {
        width: 14px;
        height: 14px;
      }
    }
  }
  .im_shop {
    flex: 1;
    .shop_grid {
      margin-top: 10px;
      flex: 1;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      overflow-y: auto;
      align-content: start;
    }
    .shop_card {
      position: relative;
      border-radius: var(--radius-card);
      background: linear-gradient(165deg, var(--color-base2), var(--color-base4));
      border: 2px solid var(--color-base1);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 3px 5px 3px #000;
      transition:
        filter 0.1s ease,
        box-shadow 0.12s ease;
      overflow: hidden;
      &:hover {
        filter: brightness(1.12);
        box-shadow:
          3px 5px 3px #000,
          0 0 0 2px var(--color-main1);
      }
      &.k_relic {
        border-color: var(--color-main3);
      }
      &.k_event {
        border-color: var(--color-negative2);
      }
      &.rare {
        border-color: var(--color-main1);
        background: linear-gradient(165deg, #5a4630, var(--color-base4));
      }
      &.sold {
        opacity: 0.45;
        filter: grayscale(0.6);
        cursor: default;
      }
      &.cannot:not(.sold) {
        filter: saturate(0.5) brightness(0.8);
      }
      .rare_ribbon {
        position: absolute;
        right: -26px;
        top: 8px;
        transform: rotate(45deg);
        background: var(--color-main2);
        color: var(--color-base5);
        font-size: 10px;
        letter-spacing: 0.15em;
        padding: 1px 30px;
      }
      .shop_icon {
        width: 44px;
        height: 44px;
        flex: none;
      }
      .shop_info {
        flex: 1;
        min-width: 0;
        .shop_name {
          color: var(--color-white0);
          font-size: var(--font-size-small);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rarity {
          margin-left: 6px;
          color: var(--color-main1);
        }
      }
      .shop_price {
        flex: none;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        .price_j {
          color: var(--color-positive1);
          font-size: var(--font-size-medium);
        }
        .price_c {
          color: var(--color-main1);
          font-size: var(--font-size-mini);
          display: inline-flex;
          align-items: center;
          gap: 2px;
          img {
            width: 14px;
            height: 14px;
          }
        }
        .sold_text {
          color: var(--color-white3);
          font-size: var(--font-size-small);
        }
      }
    }
    .shop_foot {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }
  .im_self {
    width: 360px;
    gap: 6px;
    .life_line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      .value {
        font-size: var(--font-size-xlarge);
        color: var(--color-white0);
        line-height: 1;
      }
    }
    .im_chips {
      min-height: 4px;
    }
    .heal_btn {
      align-self: flex-start;
    }
    .relic_line {
      display: flex;
      gap: 6px;
      min-height: 34px;
      flex-wrap: wrap;
      .relic_icon {
        width: 34px;
        height: 34px;
        border-radius: var(--radius-card);
        background: var(--color-base4);
        border: 1px solid var(--color-main4);
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 24px;
          height: 24px;
        }
      }
    }
    .inv_head {
      margin-top: 6px;
    }
  }
  .im_message {
    margin-top: 6px;
    color: var(--color-negative1);
  }
  .im_foot {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
