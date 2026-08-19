import assert from "node:assert/strict";
import { test } from "node:test";

import { allChapters, allLessons, courses } from "@/lib/mock/courses";
import { categories, tools, toolFilterOrder } from "@/lib/mock/taxonomy";
import { dummyProgress } from "@/lib/progress/dummy";
import { createContentApi } from "./api";
import { buildMockSnapshot } from "./mock-fallback";
import { buildSnapshot, type ContentRows } from "./snapshot";
import type {
  CategoryRow,
  ChapterRow,
  CourseRow,
  LessonRow,
  ToolRow,
} from "@/lib/supabase/database.types";

/**
 * Phase 3 の中心的な保証:
 *   「Supabase から取得しても Phase 1 と同じ内容になること」
 *
 * シード SQL は src/lib/mock から自動生成しているので、
 * ここでは同じ変換で DB 行を組み立て、buildSnapshot を通した結果が
 * mock 由来のスナップショットと一致することを検証する。
 */

const timestamps = { created_at: "2026-08-19T00:00:00Z", updated_at: "2026-08-19T00:00:00Z" };
const uuid = (prefix: string, n: number) =>
  `${prefix}-0000-0000-0000-${String(n).padStart(12, "0")}`;

/** シード SQL と同じ対応関係で、DB から返ってくる行を組み立てる */
function buildRowsFromMock(): ContentRows {
  const categoryRows: CategoryRow[] = categories
    .filter((c) => c.key !== "all")
    .map((c, i) => ({
      ...timestamps,
      id: uuid("cat", i + 1),
      slug: c.key,
      label: c.label,
      sort_order: i + 1,
    }));

  const toolRows: ToolRow[] = toolFilterOrder.map((key, i) => {
    const t = tools[key];
    return {
      ...timestamps,
      id: uuid("tool", i + 1),
      slug: t.key,
      name: t.name,
      badge: t.badge,
      gradient_from: t.gradientFrom,
      gradient_to: t.gradientTo,
      ink: t.ink,
      sort_order: i + 1,
    };
  });

  const categoryIdBySlug = new Map(categoryRows.map((r) => [r.slug, r.id]));
  const toolIdBySlug = new Map(toolRows.map((r) => [r.slug, r.id]));

  const courseRows: CourseRow[] = courses.map((course, i) => ({
    ...timestamps,
    id: uuid("course", i + 1),
    slug: course.id,
    title: course.title,
    description: course.description,
    long_description: null,
    category_id: categoryIdBySlug.get(course.category) ?? null,
    level: course.level,
    cover_bg_color: course.cover.bg,
    cover_icon: course.cover.icon ?? null,
    cover_text: course.cover.text ?? null,
    cover_text_color: course.cover.textColor ?? null,
    duration_label: course.durationLabel,
    learn_points: course.learnPoints ?? [],
    is_published: true,
    sort_order: course.sortOrder,
  }));

  const courseIdBySlug = new Map(courseRows.map((r) => [r.slug, r.id]));

  const chapterRows: ChapterRow[] = allChapters.map((chapter, i) => ({
    ...timestamps,
    id: uuid("chap", i + 1),
    course_id: courseIdBySlug.get(chapter.courseId)!,
    slug: chapter.id,
    number: chapter.number,
    title: chapter.title,
    sort_order: chapter.sortOrder,
  }));

  const chapterIdBySlug = new Map(chapterRows.map((r) => [r.slug, r.id]));

  const lessonRows: LessonRow[] = allLessons.map((lesson, i) => ({
    ...timestamps,
    id: uuid("less", i + 1),
    slug: lesson.id,
    course_id: courseIdBySlug.get(lesson.courseId)!,
    chapter_id: chapterIdBySlug.get(lesson.chapterId)!,
    number: lesson.number,
    title: lesson.title,
    description: lesson.description ?? null,
    key_points: lesson.keyPoints ?? [],
    stream_video_id: null,
    duration_seconds: lesson.durationSeconds,
    tool_id: toolIdBySlug.get(lesson.tool) ?? null,
    category_id: categoryIdBySlug.get(lesson.category) ?? null,
    level: lesson.level,
    is_published: true,
    published_at: lesson.publishedAt,
    sort_order: lesson.sortOrder,
  }));

  return {
    categories: categoryRows,
    tools: toolRows,
    courses: courseRows,
    chapters: chapterRows,
    lessons: lessonRows,
  };
}

/** undefined なキーの有無を吸収して比較する */
const normalize = (value: unknown) => JSON.parse(JSON.stringify(value));

const dbSnapshot = buildSnapshot(buildRowsFromMock(), dummyProgress);
const mockSnapshot = buildMockSnapshot(dummyProgress);
const api = createContentApi(dbSnapshot, dummyProgress);

test("DB 由来のスナップショットが Phase 1 の内容と完全に一致する", () => {
  assert.deepEqual(normalize(dbSnapshot.courses), normalize(mockSnapshot.courses));
  assert.deepEqual(normalize(dbSnapshot.chapters), normalize(mockSnapshot.chapters));
  assert.deepEqual(normalize(dbSnapshot.lessons), normalize(mockSnapshot.lessons));
  assert.deepEqual(normalize(dbSnapshot.categories), normalize(mockSnapshot.categories));
  assert.deepEqual(normalize(dbSnapshot.tools), normalize(mockSnapshot.tools));
});

test("件数が Claude Design のダミー教材どおり", () => {
  assert.equal(dbSnapshot.courses.length, 6);
  assert.equal(dbSnapshot.chapters.length, 25);
  assert.equal(dbSnapshot.lessons.length, 90);
  // 「すべて」を含むので DB のカテゴリ数 + 1
  assert.equal(dbSnapshot.categories.length, 6);
});

test("id には uuid ではなく slug が入る（Phase 1 の URL を維持）", () => {
  assert.ok(api.getCourse("premiere-practice"));
  assert.ok(api.getLesson("premiere-practice-05"));
  assert.ok(api.getChapter("premiere-practice-ch2"));
});

test("カテゴリとツールが正しく解決される", () => {
  const lesson = api.getLesson("premiere-practice-05")!;
  assert.equal(lesson.tool, "premiere");
  assert.equal(lesson.category, "video-editing");
  assert.equal(api.categoryLabel("video-editing"), "動画編集");
  assert.equal(api.tools.premiere.badge, "Pr");
});

test("コースの本数が教材データから算出される", () => {
  assert.equal(api.getCourse("premiere-practice")!.totalLessons, 18);
  assert.equal(api.getCourse("ai-editing")!.totalLessons, 14);
  assert.equal(api.getCourse("ai-client-acquisition")!.totalLessons, 20);
});

test("チャプター / レッスンが sort_order 順に並ぶ", () => {
  const chapters = api.getChaptersByCourse("premiere-practice");
  assert.deepEqual(
    chapters.map((c) => c.number),
    [1, 2, 3, 4, 5, 6],
  );
  const lessons = api.getLessonsByCourse("premiere-practice");
  assert.deepEqual(
    lessons.map((l) => l.number),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
});

test("前後の動画がコース内で正しく引ける", () => {
  const { prev, next } = api.getAdjacentLessons("premiere-practice-05");
  assert.equal(prev?.id, "premiere-practice-04");
  assert.equal(next?.id, "premiere-practice-06");

  // コースの先頭・末尾では隣が無い
  assert.equal(api.getAdjacentLessons("premiere-practice-01").prev, undefined);
  assert.equal(api.getAdjacentLessons("premiere-practice-18").next, undefined);
});

test("動画一覧の 1 ページ目が Claude Design の並びと一致する", () => {
  const first9 = api.getAllLessonsInListOrder().slice(0, 9).map((l) => l.id);
  assert.deepEqual(first9, dummyProgress.videoListOrder);
  // 全件が漏れなく含まれる
  assert.equal(api.getAllLessonsInListOrder().length, 90);
});

test("進捗は教材ではなくダミー側から供給される（Phase 5 の境界）", () => {
  const course = api.getCourse("premiere-practice")!;
  assert.equal(course.status, "in_progress");
  assert.equal(course.completedLessons, 8);
  assert.equal(course.nextLessonId, "premiere-practice-05");
  assert.equal(api.getCoursePercent(course), 44);

  assert.equal(api.getLessonStatus("premiere-practice-05"), "in_progress");
  assert.equal(api.getLessonPercent("premiere-practice-05"), 62);
  assert.equal(api.getLessonStatus("premiere-practice-18"), "not_started");
});

test("チャプター集計が Claude Design の表示どおり", () => {
  const stats = api.getChapterStats("premiere-practice-ch2");
  assert.equal(stats.total, 4);
  assert.equal(stats.completedCount, 2);
  assert.equal(stats.hasCurrent, true);
  assert.equal(stats.durationLabel, "約38分");
});

test("存在しない ID は undefined を返す", () => {
  assert.equal(api.getCourse("no-such-course"), undefined);
  assert.equal(api.getLesson("no-such-lesson"), undefined);
  assert.deepEqual(api.getAdjacentLessons("no-such-lesson"), {});
});

test("非公開コンテンツはスナップショットに含まれない（RLS 前提の確認）", () => {
  // RLS で除外された想定＝行が返ってこないケース
  const rows = buildRowsFromMock();
  rows.courses = rows.courses.filter((c) => c.slug !== "capcut-practice");
  rows.chapters = rows.chapters.filter(
    (c) => !c.slug.startsWith("capcut-practice"),
  );
  rows.lessons = rows.lessons.filter((l) => !l.slug.startsWith("capcut-practice"));

  const limited = createContentApi(buildSnapshot(rows, dummyProgress), dummyProgress);
  assert.equal(limited.getCourse("capcut-practice"), undefined);
  assert.equal(limited.courses.length, 5);
  assert.equal(limited.getLessonsByCourse("capcut-practice").length, 0);
});

test("stream_video_id が無い間は undefined（Phase 4 で切り替わる）", () => {
  assert.equal(api.getLesson("premiere-practice-05")!.streamVideoId, undefined);
});
