<template>
  <div class="book_select scene">
    <div class="scene_bg strong_dim" :style="{ backgroundImage: 'url(assets/backgrounds/toshokan.png)' }"></div>
    <div class="bs_figure trans_left_in"><CharacterFigure :character-id="character.id" :face-id="1" /></div>

    <div v-hover-se class="bs_profile panel_glass orn_frame trans_raise_in">
      <div class="bs_name">{{ character.name }}</div>
      <div class="hint">{{ character.asKnownAs }}</div>
      <div class="bs_desc">{{ character.description }}</div>
      <div class="bs_stats">
        <span class="chip"><Shape kind="life" :text="null" size="tiny" />{{ character.hp }}</span>
        <span class="chip"><Shape kind="attack" :text="null" size="tiny" />{{ character.power }}</span>
        <span v-if="character.wings" class="chip"><Shape kind="wings" :text="null" size="tiny" />{{ T("profile.wings") }}</span>
      </div>
      <div class="bs_star">
        <span class="star_delta_chip" :class="deltaClass(delta)"
          >{{ T("star.delta") }} <b>{{ signedDelta(delta) }}</b></span
        >
        <button class="btn sub small" @click="openStar">{{ T("star.heading") }}</button>
      </div>
      <Ornament kind="rule" />
      <div class="bs_sub_head">{{ T("book.skits") }}</div>
      <div class="bs_skits">
        <button v-for="s in skitList" :key="s.id" class="skit_row" :class="{ locked: !s.unlocked }" :disabled="!s.unlocked" @click="replay(s)">
          <span class="skit_name">{{ s.unlocked ? s.name : T("book.skitLocked") }}</span>
          <span class="hint">{{ s.unlocked ? T(`skit.type.${s.type}`) : T(`skit.trigger.${s.trigger}`) }}</span>
        </button>
      </div>
      <div v-if="misfortunes.length" class="bs_sub_head">{{ T("book.misfortunes") }}</div>
      <div class="bs_misfortunes">
        <span v-for="m in misfortunes" :key="m.id" class="chip bad" :class="{ unseen: !m.seen }" :data-desc="`event:${m.id}`">{{
          m.seen ? m.name : "???"
        }}</span>
      </div>
    </div>

    <div v-hover-se class="bs_books no_scrollbar">
      <div
        v-for="(b, i) in books"
        :key="b.id"
        class="book_card panel_glass orn_frame trans_raise_in"
        :class="[`delay_${i + 1}`, { others: b.characterId !== character.id }]"
      >
        <div class="book_head">
          <div class="book_name">{{ b.name }}</div>
          <span v-if="b.characterId !== character.id" class="chip">{{ T("book.others") }}</span>
        </div>
        <div class="book_desc">{{ b.description }}</div>
        <div class="book_chapters">
          <div v-for="(cid, ci) in b.chapterIds" :key="cid" class="chapter_row" :data-desc="null">
            <span class="ch_no">{{ ci + 1 }}</span
            ><span class="ch_name">{{ master.get("chapters", cid).name }}</span
            ><span class="hint">{{ master.get("chapters", cid).description }}</span>
          </div>
          <div v-if="b.extraChapterId != null" class="chapter_row extra">
            <span class="ch_no">EX</span><span class="ch_name">{{ master.get("chapters", b.extraChapterId).name }}</span
            ><span class="hint">{{ T("book.threshold", { n: b.harshnessThreshold }) }}</span>
          </div>
        </div>
        <div v-if="rulesOf(b).length" class="book_rules">
          <span class="hint">{{ T("book.rules") }}</span>
          <span v-for="r in rulesOf(b)" :key="r.id" class="chip" :title="r.description"
            ><img class="icon_img" :src="iconPath(r.icon)" alt="" />{{ r.name }}</span
          >
        </div>
        <div class="book_record hint">{{ recordText(b) }}</div>
        <div class="book_buttons">
          <button v-if="session.hasRunSave" class="btn" @click="resume">{{ T("book.continue") }}</button>
          <button v-if="session.hasRunSave" class="btn sub" @click="restart(b)">{{ T("book.restart") }}</button>
          <button v-else class="btn" @click="start(b)">{{ T("book.start") }}</button>
        </div>
      </div>
    </div>
    <button class="btn sub small back_btn" @click="back">{{ T("common.back") }}</button>
  </div>
</template>

<script setup>
// 本の選択 (07 CharacterDetail + BookSelect を兼ねる): 左にプロフィール / スターパレット / スキット一覧 / 見た不利イベント、右に本のカード
import { computed, onMounted } from "vue";
import { master } from "@core/master/index.js";
import { booksOf } from "@core/queries/index.js";
import { deltaOf as starDelta, normalize, snapshot } from "@core/star/palette.js";
import { useSessionStore } from "../stores/session.js";
import { useRunStore } from "../stores/run.js";
import { skitsOf, skitUnlocked, playSkit, playSkitFor } from "../flow/skits.js";
import { resumeRun } from "../flow/title.js";
import { iconPath } from "../ui/entity_view.js";
import { deltaClass, signedDelta } from "../ui/star_view.js";
import { T } from "../text.js";
import SoundManager from "../sound/sound_manager.js";
import CharacterFigure from "../components/CharacterFigure.vue";
import Ornament from "../components/Ornament.vue";
import Shape from "../components/Shape.vue";

const session = useSessionStore();
const run = useRunStore();
const character = computed(() => master.get("characters", session.sceneParams.characterId));
const progress = computed(() => session.characterProgress(character.value.id));
const delta = computed(() => starDelta(character.value.id, normalize(character.value.id, progress.value.star.activeNodeIds, progress.value)));
// 自分の本を先頭、他人の本は「やり込み」
const books = computed(() => {
  const mine = booksOf(character.value.id);
  const others = master.all("books").filter((b) => b.characterId !== character.value.id);
  return [...mine, ...others];
});
const skitList = computed(() => skitsOf(character.value.id).map((s) => ({ ...s, unlocked: skitUnlocked(s, progress.value) })));
const misfortunes = computed(() =>
  master
    .all("events")
    .filter((e) => e.kind === "misfortune" && (e.characterId === character.value.id || e.characterId === -1))
    .map((e) => ({ ...e, seen: !!progress.value.misfortunesSeen[e.id] })),
);
const rulesOf = (b) => master.where("bookRules", "bookId", b.id);

onMounted(() => session.setBgm(character.value.bgmId || "title"));

function recordText(b) {
  const r = session.record(character.value.id, b.id);
  if (!r.tries) return T("menu.noRecord");
  const parts = [
    T("book.record.tries", { n: r.tries }),
    T("book.record.normal", { n: r.normalEnds }),
    T("book.record.happy", { n: r.happyEnds }),
    T("book.record.lose", { n: r.losses }),
  ];
  if (r.bestDelta != null) parts.push(T("menu.bestDelta", { n: signedDelta(r.bestDelta) }));
  return parts.join(" / ");
}
async function start(b) {
  SoundManager.playSe("gameStart");
  const cid = character.value.id;
  const star = snapshot(cid, progress.value.star.activeNodeIds, progress.value);
  run.start({ characterId: cid, bookId: b.id, star, difficulty: progress.value.star.lastPreset });
  session.setScene("inGame");
  await playSkitFor("bookStart", b.characterId);
}
async function restart(b) {
  const yes = await session.openDialog("confirm", { text: T("book.restartConfirm"), danger: true });
  if (!yes) return;
  await session.removeRun();
  await start(b);
}
async function resume() {
  SoundManager.playSe("ok");
  await resumeRun();
}
function replay(s) {
  SoundManager.playSe("ok");
  playSkit(s.id);
}
function openStar() {
  SoundManager.playSe("open");
  session.setScene("star", { characterId: character.value.id, back: "bookSelect" });
}
function back() {
  SoundManager.playSe("cancel");
  session.setScene("menu");
}
</script>

<style lang="scss" scoped>
.book_select {
  overflow: hidden;
  .bs_figure {
    position: absolute;
    left: -140px;
    top: 40px;
    width: 620px;
    height: 930px;
    pointer-events: none;
    opacity: 0.9;
  }
  .bs_profile {
    position: absolute;
    left: 330px;
    top: 30px;
    width: 340px;
    bottom: 70px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;
    .bs_name {
      font-size: var(--font-size-large);
      color: var(--color-main1);
    }
    .bs_desc {
      margin-top: 4px;
      font-size: var(--font-size-small);
      color: var(--color-white2);
      line-height: 1.6;
    }
    .bs_stats {
      margin-top: 6px;
      display: flex;
      gap: 6px;
    }
    .bs_star {
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bs_sub_head {
      margin-top: 8px;
      color: var(--color-main2);
      font-size: var(--font-size-small);
      letter-spacing: 0.1em;
    }
    .bs_skits {
      display: flex;
      flex-direction: column;
      gap: 3px;
      .skit_row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 3px 8px;
        border-radius: var(--radius-card);
        background: rgba(0, 0, 0, 0.25);
        text-align: left;
        font-size: var(--font-size-small);
        &:hover:not(:disabled) {
          background: rgba(255, 228, 178, 0.14);
        }
        &.locked {
          color: var(--color-white3);
          cursor: default;
        }
      }
    }
    .bs_misfortunes {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      .chip.unseen {
        opacity: 0.5;
      }
    }
  }
  .bs_books {
    position: absolute;
    left: 700px;
    right: 30px;
    top: 30px;
    bottom: 70px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .book_card {
    padding: 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    &.others {
      opacity: 0.85;
    }
    .book_head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .book_name {
      font-size: var(--font-size-large);
      color: var(--color-main1);
      text-shadow: 0 2px 0 var(--color-base5);
    }
    .book_desc {
      font-size: var(--font-size-small);
      color: var(--color-white2);
      line-height: 1.6;
    }
    .book_chapters {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .chapter_row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-size: var(--font-size-small);
        .ch_no {
          width: 24px;
          color: var(--color-main3);
        }
        .ch_name {
          color: var(--color-white0);
          white-space: nowrap;
        }
        .hint {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &.extra .ch_no {
          color: var(--color-negative1);
        }
      }
    }
    .book_rules {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      img {
        width: 16px;
        height: 16px;
      }
    }
    .book_buttons {
      margin-top: 4px;
      display: flex;
      gap: 12px;
    }
  }
}
.star_delta_chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-round);
  background: rgba(10, 10, 16, 0.55);
  border: 1px solid var(--color-base1);
  font-size: var(--font-size-mini);
  color: var(--color-white3);
  b {
    color: var(--color-white);
    font-size: var(--font-size-small);
    font-weight: normal;
  }
  &.neg b {
    color: var(--color-negative1);
  }
  &.pos b {
    color: var(--color-accent3);
  }
}
</style>
