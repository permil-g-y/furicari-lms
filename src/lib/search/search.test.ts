import assert from "node:assert/strict";
import { test } from "node:test";

import { allChapters, allLessons, courses } from "@/lib/mock/courses";
import { categories, tools } from "@/lib/mock/taxonomy";
import { parseQuery, searchContent, type SearchContent } from "./search";

/**
 * Phase 6-C の中心的な保証:
 *   「教材スナップショットに対するメモリ検索が、意図した対象にヒットすること」
 *
 * データは Phase 1 の教材定義をそのまま使う（シードの生成元と同じもの）。
 */

const content: SearchContent = {
  courses,
  allChapters,
  allLessons,
  categories: [{ key: "all", label: "すべて" }, ...categories],
  tools,
};

const find = (q: string) => searchContent(content, q);

test("検索語を空白で分割する（全角スペースも区切り）", () => {
  assert.deepEqual(parseQuery("  カット　編集 "), ["カット", "編集"]);
  assert.deepEqual(parseQuery("   "), []);
});

test("空の検索語では何も返さない", () => {
  const r = find("");
  assert.equal(r.total, 0);
  assert.deepEqual(r.terms, []);
});

test("レッスンのタイトルで見つかる", () => {
  const r = find("カット編集の基本");
  assert.ok(r.lessons.some((l) => l.id === "premiere-practice-05"));
});

test("コースのタイトルで見つかる", () => {
  const r = find("Premiere Pro 実践");
  assert.ok(r.courses.some((c) => c.id === "premiere-practice"));
});

test("チャプター名で検索すると、その配下のレッスンが出る", () => {
  // 「テロップ・字幕」は Chapter 名。単独では結果に出さず、レッスン側でヒットさせる
  const chapter = allChapters.find((c) => c.title.includes("テロップ"));
  assert.ok(chapter, "テロップを含むチャプターが存在すること");

  const r = find("テロップ");
  const lessonsInChapter = r.lessons.filter((l) => l.chapterId === chapter!.id);
  assert.ok(lessonsInChapter.length > 0, "チャプター配下のレッスンがヒットする");
});

test("ツール名で見つかる", () => {
  const r = find("CapCut");
  assert.ok(r.lessons.length > 0);
  assert.ok(r.lessons.every((l) => {
    const course = courses.find((c) => c.id === l.courseId);
    return (
      tools[l.tool].name.includes("CapCut") ||
      l.title.includes("CapCut") ||
      (course?.title ?? "").includes("CapCut")
    );
  }));
});

test("複数語は AND 検索になる", () => {
  const single = find("編集");
  const both = find("編集 ショートカット");
  assert.ok(both.total < single.total, "語を足すと絞り込まれる");
  assert.ok(both.lessons.every((l) => {
    const haystack = [l.title, l.description ?? "", ...(l.keyPoints ?? [])].join(" ");
    return haystack.includes("ショートカット") || haystack.includes("編集");
  }));
});

test("大文字小文字を区別しない", () => {
  assert.equal(find("premiere").total, find("PREMIERE").total);
});

test("ヒットしない語では 0 件になる", () => {
  const r = find("ぜったいにヒットしない語句xyz");
  assert.equal(r.total, 0);
  assert.equal(r.courses.length, 0);
  assert.equal(r.lessons.length, 0);
});

test("チャプターは単独の検索結果には含まれない", () => {
  const r = find("はじめに");
  // SearchResult は courses と lessons だけを持つ
  assert.deepEqual(Object.keys(r).sort(), ["courses", "lessons", "terms", "total"]);
});
