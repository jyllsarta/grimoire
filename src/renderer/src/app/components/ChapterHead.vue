<template>
  <div class="chapter_head">
    <div class="chapter_name">
      <svg class="orn_spark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
      </svg>
      <span>{{ chapter.name }}</span>
      <svg class="orn_spark" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" />
      </svg>
    </div>
    <Ornament kind="rule" />
    <div class="book_name">{{ book.name }}<span v-if="extra" class="extra"> / Extra Chapter</span></div>
    <div v-if="rules.length" class="rules" data-tips="bookRule">
      <span v-for="r in rules" :key="r.id" class="rule" :title="r.description"
        ><img class="icon_img" :src="iconPath(r.icon)" alt="" />{{ r.name }}</span
      >
    </div>
  </div>
</template>

<script setup>
// 左上の章名 (tale layer_head) + 本名 + 本のルール (07: 章名の近くに常時表示)
import { computed } from "vue";
import { master } from "@core/master/index.js";
import { currentChapter } from "@core/queries/index.js";
import { isExtraChapter } from "@core/domain/chapter.js";
import { useRunStore } from "../stores/run.js";
import { iconPath } from "../ui/entity_view.js";
import Ornament from "./Ornament.vue";

const run = useRunStore();
const chapter = computed(() => currentChapter(run.state));
const book = computed(() => master.get("books", run.state.bookId));
const rules = computed(() => master.where("bookRules", "bookId", run.state.bookId));
const extra = computed(() => isExtraChapter(run.state));
</script>

<style lang="scss" scoped>
.chapter_head {
  width: 250px;
  .chapter_name {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-main1);
    font-size: var(--font-size-large);
    text-shadow: 0 3px 0 var(--color-base5);
    white-space: nowrap;
    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .orn_spark {
      width: 14px;
      height: 14px;
    }
  }
  :deep(.orn_rule) {
    margin-top: 2px;
  }
  .book_name {
    color: var(--color-white3);
    font-size: var(--font-size-mini);
    margin-top: 2px;
    text-align: center;
    .extra {
      color: var(--color-negative1);
    }
  }
  .rules {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    .rule {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      border-radius: var(--radius-round);
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--color-base2);
      font-size: var(--font-size-mini);
      color: var(--color-main2);
      img {
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style>
