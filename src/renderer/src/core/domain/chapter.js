// 章の列 (02 progress)。chapterSequence = books.chapterIds に、stage が extra なら extraChapterId を末尾に足したもの
import { master } from "../master/index.js";

export function chapterSequence(state) {
  const book = master.get("books", state.bookId);
  const seq = [...book.chapterIds];
  if (state.progress.stage === "extra" && book.extraChapterId != null) seq.push(book.extraChapterId);
  return seq;
}

export function currentChapterId(state) {
  return chapterSequence(state)[state.progress.chapterIndex];
}

export function currentChapter(state) {
  return master.get("chapters", currentChapterId(state));
}

// いまの章が本編の最終章か
export function isLastMainChapter(state) {
  const book = master.get("books", state.bookId);
  return state.progress.stage === "main" && state.progress.chapterIndex === book.chapterIds.length - 1;
}

// いまの章が Extra Chapter か
export function isExtraChapter(state) {
  const book = master.get("books", state.bookId);
  return state.progress.stage === "extra" && state.progress.chapterIndex === book.chapterIds.length;
}

// 次の章の id (無ければ null)
export function nextChapterId(state) {
  const seq = chapterSequence(state);
  return seq[state.progress.chapterIndex + 1] ?? null;
}

// 章 id → 本の中での章番号 (chapterIds の 1 始まり、Extra Chapter は chapterIds.length + 1)。本に無ければ null
export function chapterNumberOf(state, chapterId) {
  const book = master.get("books", state.bookId);
  const i = book.chapterIds.indexOf(chapterId);
  if (i >= 0) return i + 1;
  if (book.extraChapterId === chapterId) return book.chapterIds.length + 1;
  return null;
}
