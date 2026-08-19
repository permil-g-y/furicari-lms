import { allChapters, allLessons, courseLongDescription, courses } from "@/lib/mock/courses";
import { categories, tools, toolFilterOrder } from "@/lib/mock/taxonomy";
import type { DummyProgressSource } from "@/lib/progress/dummy";
import type { ContentSnapshot } from "./api";

/**
 * 開発用フォールバック。
 *
 * Supabase にマイグレーション / シードがまだ適用されていない状態でも
 * 画面が動くようにするためだけのもの。**恒久的な primary source ではない。**
 * ここが使われると server.ts が警告を出す。
 *
 * Seed SQL（supabase/seed/0001_content.sql）は同じ src/lib/mock から
 * 自動生成しているため、フォールバックと DB の内容は一致する。
 */
export function buildMockSnapshot(progress: DummyProgressSource): ContentSnapshot {
  // DB 経由（buildSnapshot）と完全に同じ並びにする。
  // mock の配列は定義を連結しただけの偶発的な順序なので、
  // 「コースの並び順 → コース内の並び順」で並べ直す。
  const courseOrder = new Map(courses.map((c) => [c.id, c.sortOrder]));
  const byCourseThenOrder = <T extends { courseId: string; sortOrder: number }>(
    a: T,
    b: T,
  ) =>
    (courseOrder.get(a.courseId) ?? 0) - (courseOrder.get(b.courseId) ?? 0) ||
    a.sortOrder - b.sortOrder;

  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of allLessons) {
    lessonCountByCourse.set(
      lesson.courseId,
      (lessonCountByCourse.get(lesson.courseId) ?? 0) + 1,
    );
  }

  return {
    categories,
    tools,
    toolFilterOrder,
    courses: courses.map((course) => ({
      ...course,
      totalLessons: lessonCountByCourse.get(course.id) ?? 0,
      completedLessons: progress.completedLessonsByCourse[course.id] ?? 0,
      status: progress.courseStatus[course.id] ?? "not_started",
      nextLessonId: progress.nextLessonByCourse[course.id],
    })),
    chapters: [...allChapters].sort(byCourseThenOrder),
    lessons: [...allLessons].sort(byCourseThenOrder),
  };
}

export const mockLongDescriptions = courseLongDescription;
