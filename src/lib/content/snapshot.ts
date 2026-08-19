import type {
  Category,
  CategoryKey,
  Chapter,
  Course,
  Lesson,
  Tool,
  ToolKey,
} from "@/lib/types";
import type {
  CategoryRow,
  ChapterRow,
  CourseRow,
  LessonRow,
  ToolRow,
} from "@/lib/supabase/database.types";
import type { DummyProgressSource } from "@/lib/progress/dummy";
import type { ContentSnapshot } from "./api";

/**
 * Supabase の行 → 画面が使うドメイン型 への変換。
 *
 * ドメイン側の id には uuid ではなく **slug** を入れる。
 * Phase 1 の URL（/courses/premiere-practice, /watch/premiere-practice-05）を
 * そのまま維持でき、管理画面から uuid を意識せず扱えるため。
 */

export type ContentRows = {
  categories: CategoryRow[];
  tools: ToolRow[];
  courses: CourseRow[];
  chapters: ChapterRow[];
  lessons: LessonRow[];
};

export function buildSnapshot(
  rows: ContentRows,
  progress: DummyProgressSource,
): ContentSnapshot {
  const categorySlugById = new Map(rows.categories.map((c) => [c.id, c.slug as CategoryKey]));
  const toolSlugById = new Map(rows.tools.map((t) => [t.id, t.slug as ToolKey]));
  const courseSlugById = new Map(rows.courses.map((c) => [c.id, c.slug]));
  const chapterSlugById = new Map(rows.chapters.map((c) => [c.id, c.slug]));

  // 「すべて」は UI 上の仮想カテゴリなので DB には存在しない。先頭に足す。
  const categories: Category[] = [
    { key: "all", label: "すべて" },
    ...[...rows.categories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({ key: row.slug as CategoryKey, label: row.label })),
  ];

  const sortedTools = [...rows.tools].sort((a, b) => a.sort_order - b.sort_order);
  const toolFilterOrder = sortedTools.map((t) => t.slug as ToolKey);
  const tools = Object.fromEntries(
    sortedTools.map((row): [ToolKey, Tool] => [
      row.slug as ToolKey,
      {
        key: row.slug as ToolKey,
        name: row.name,
        badge: row.badge,
        gradientFrom: row.gradient_from,
        gradientTo: row.gradient_to,
        ink: row.ink,
      },
    ]),
  ) as Record<ToolKey, Tool>;

  const lessonsByCourseSlug = new Map<string, number>();
  for (const row of rows.lessons) {
    const slug = courseSlugById.get(row.course_id);
    if (!slug) continue;
    lessonsByCourseSlug.set(slug, (lessonsByCourseSlug.get(slug) ?? 0) + 1);
  }

  const courses: Course[] = [...rows.courses]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.slug,
      title: row.title,
      description: row.description,
      category: (row.category_id ? categorySlugById.get(row.category_id) : undefined) ?? "all",
      level: row.level,
      cover: {
        bg: row.cover_bg_color,
        icon: row.cover_icon ?? undefined,
        text: row.cover_text ?? undefined,
        textColor: row.cover_text_color ?? undefined,
      },
      durationLabel: row.duration_label,
      learnPoints: row.learn_points?.length ? row.learn_points : undefined,
      sortOrder: row.sort_order,

      // 教材データから算出
      totalLessons: lessonsByCourseSlug.get(row.slug) ?? 0,

      // ↓ ここから下は学習進捗。Phase 5 で Supabase へ差し替える（progress/dummy.ts）
      completedLessons: progress.completedLessonsByCourse[row.slug] ?? 0,
      status: progress.courseStatus[row.slug] ?? "not_started",
      nextLessonId: progress.nextLessonByCourse[row.slug],
    }));

  // sort_order はコース内の連番なので、全体を sort_order だけで並べるとコースが混ざる。
  // 「コースの並び順 → コース内の並び順」の 2 段で並べる。
  const courseOrderById = new Map(rows.courses.map((c) => [c.id, c.sort_order]));
  const byCourseThenOrder = <T extends { course_id: string; sort_order: number }>(
    a: T,
    b: T,
  ) =>
    (courseOrderById.get(a.course_id) ?? 0) - (courseOrderById.get(b.course_id) ?? 0) ||
    a.sort_order - b.sort_order;

  const chapters: Chapter[] = [...rows.chapters]
    .sort(byCourseThenOrder)
    .map((row) => ({
      id: row.slug,
      courseId: courseSlugById.get(row.course_id) ?? "",
      number: row.number,
      title: row.title,
      sortOrder: row.sort_order,
    }));

  const lessons: Lesson[] = [...rows.lessons]
    .sort(byCourseThenOrder)
    .map((row) => ({
      id: row.slug,
      courseId: courseSlugById.get(row.course_id) ?? "",
      chapterId: chapterSlugById.get(row.chapter_id) ?? "",
      number: row.number,
      title: row.title,
      description: row.description ?? undefined,
      keyPoints: row.key_points?.length ? row.key_points : undefined,
      durationSeconds: row.duration_seconds,
      tool: (row.tool_id ? toolSlugById.get(row.tool_id) : undefined) ?? "premiere",
      category: (row.category_id ? categorySlugById.get(row.category_id) : undefined) ?? "all",
      level: row.level,
      streamVideoId: row.stream_video_id ?? undefined,
      publishedAt: row.published_at,
      sortOrder: row.sort_order,
    }));

  return { categories, tools, toolFilterOrder, courses, chapters, lessons };
}

/** コース詳細の長文説明（DB 由来） */
export function buildLongDescriptions(rows: CourseRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.long_description) map[row.slug] = row.long_description;
  }
  return map;
}
