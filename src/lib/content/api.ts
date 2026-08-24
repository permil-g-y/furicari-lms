import type {
  Category,
  CategoryKey,
  Chapter,
  Course,
  Lesson,
  Tool,
  ToolKey,
} from "@/lib/types";
import { dummyProgress } from "@/lib/progress/dummy";
import type { ProgressSource } from "@/lib/progress/types";
import type { LessonProgress, LessonStatus } from "@/lib/types";

/**
 * Supabase から取得した教材データのスナップショット。
 * 件数が小さい（コース 6・チャプター 25・レッスン 90）ため、
 * リクエストごとに一括取得してこの形で持ち回る。
 */
export type ContentSnapshot = {
  categories: Category[];
  tools: Record<ToolKey, Tool>;
  toolFilterOrder: ToolKey[];
  courses: Course[];
  chapters: Chapter[];
  lessons: Lesson[];
};

/**
 * 教材データにアクセスするための API。
 *
 * ■ 教材（Supabase 由来）と 学習進捗（まだダミー）の境界
 *   - courses / chapters / lessons / categories / tools … Supabase が唯一の source of truth
 *   - 進捗系（getProgress / getLessonStatus / getCoursePercent / status /
 *     completedLessons / nextLessonId など）… Phase 5 まではダミー
 *     （src/lib/progress/dummy.ts）。差し替え箇所はそこ 1 ファイルに閉じている。
 */
export type ContentApi = ReturnType<typeof createContentApi>;

export function createContentApi(
  snapshot: ContentSnapshot,
  progress: ProgressSource = dummyProgress,
) {
  const courseById = new Map(snapshot.courses.map((c) => [c.id, c]));
  const chapterById = new Map(snapshot.chapters.map((c) => [c.id, c]));
  const lessonById = new Map(snapshot.lessons.map((l) => [l.id, l]));
  const progressById = new Map(progress.lessonProgress.map((p) => [p.lessonId, p]));

  const chaptersByCourse = new Map<string, Chapter[]>();
  for (const chapter of snapshot.chapters) {
    const list = chaptersByCourse.get(chapter.courseId) ?? [];
    list.push(chapter);
    chaptersByCourse.set(chapter.courseId, list);
  }
  for (const list of chaptersByCourse.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const lessonsByCourse = new Map<string, Lesson[]>();
  const lessonsByChapter = new Map<string, Lesson[]>();
  for (const lesson of snapshot.lessons) {
    const byCourse = lessonsByCourse.get(lesson.courseId) ?? [];
    byCourse.push(lesson);
    lessonsByCourse.set(lesson.courseId, byCourse);

    const byChapter = lessonsByChapter.get(lesson.chapterId) ?? [];
    byChapter.push(lesson);
    lessonsByChapter.set(lesson.chapterId, byChapter);
  }
  for (const list of lessonsByCourse.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
  for (const list of lessonsByChapter.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  /* ---- コンテンツ ---------------------------------------------------- */

  function getCourse(courseId: string): Course | undefined {
    return courseById.get(courseId);
  }
  function getLesson(lessonId: string): Lesson | undefined {
    return lessonById.get(lessonId);
  }
  function getChapter(chapterId: string): Chapter | undefined {
    return chapterById.get(chapterId);
  }
  function getChaptersByCourse(courseId: string): Chapter[] {
    return chaptersByCourse.get(courseId) ?? [];
  }
  function getLessonsByCourse(courseId: string): Lesson[] {
    return lessonsByCourse.get(courseId) ?? [];
  }
  function getLessonsByChapter(chapterId: string): Lesson[] {
    return lessonsByChapter.get(chapterId) ?? [];
  }
  function getLessons(ids: string[]): Lesson[] {
    return ids.map((id) => lessonById.get(id)).filter((l): l is Lesson => !!l);
  }
  function getCourses(ids: string[]): Course[] {
    return ids.map((id) => courseById.get(id)).filter((c): c is Course => !!c);
  }

  function categoryLabel(key: CategoryKey): string {
    return snapshot.categories.find((c) => c.key === key)?.label ?? "";
  }

  /** コース内での前後の動画 */
  function getAdjacentLessons(lessonId: string): { prev?: Lesson; next?: Lesson } {
    const lesson = lessonById.get(lessonId);
    if (!lesson) return {};
    const siblings = getLessonsByCourse(lesson.courseId);
    const index = siblings.findIndex((l) => l.id === lessonId);
    return {
      prev: index > 0 ? siblings[index - 1] : undefined,
      next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined,
    };
  }

  /**
   * 動画一覧のデフォルト表示順。
   * Claude Design の 1 ページ目に出ていた並びを先頭に固定し、残りを続ける。
   */
  function getAllLessonsInListOrder(): Lesson[] {
    const curated = getLessons(progress.videoListOrder);
    const curatedIds = new Set(progress.videoListOrder);
    const rest = snapshot.lessons.filter((l) => !curatedIds.has(l.id));
    return [...curated, ...rest];
  }

  /* ---- 進捗（Phase 5 までダミー） ------------------------------------- */

  function getProgress(lessonId: string): LessonProgress {
    return (
      progressById.get(lessonId) ?? {
        lessonId,
        status: "not_started",
        positionSeconds: 0,
      }
    );
  }

  function getLessonStatus(lessonId: string): LessonStatus {
    return getProgress(lessonId).status;
  }

  /** 動画単位の視聴率（0-100） */
  function getLessonPercent(lessonId: string): number {
    const lesson = lessonById.get(lessonId);
    const p = getProgress(lessonId);
    if (!lesson) return 0;
    if (p.status === "completed") return 100;
    if (p.status === "not_started") return 0;
    return Math.round((p.positionSeconds / lesson.durationSeconds) * 100);
  }

  /** そのコースの総本数（教材データから算出） */
  function getCourseTotalLessons(courseId: string): number {
    return getLessonsByCourse(courseId).length;
  }

  /** そのコースの視聴済み本数（ダミー進捗） */
  function getCourseCompletedLessons(courseId: string): number {
    const override = progress.completedLessonsByCourse[courseId];
    if (override !== undefined) return override;
    return getLessonsByCourse(courseId).filter(
      (l) => getLessonStatus(l.id) === "completed",
    ).length;
  }

  /** コースの進捗率（0-100） */
  function getCoursePercent(course: Course): number {
    const total = getCourseTotalLessons(course.id);
    if (total === 0) return 0;
    return Math.round((getCourseCompletedLessons(course.id) / total) * 100);
  }

  /** コースの受講状態（ダミー） */
  function getCourseStatus(courseId: string) {
    return progress.courseStatus[courseId] ?? "not_started";
  }

  /** 「学習を続ける」の遷移先 */
  function getResumeLessonId(course: Course): string {
    return (
      progress.nextLessonByCourse[course.id] ??
      getLessonsByCourse(course.id)[0]?.id ??
      ""
    );
  }

  /** チャプター単位の集計（アコーディオンのメタ表示用） */
  function getChapterStats(chapterId: string) {
    const lessons = getLessonsByChapter(chapterId);
    const completedCount = lessons.filter(
      (l) => getLessonStatus(l.id) === "completed",
    ).length;
    const hasCurrent = lessons.some((l) => getLessonStatus(l.id) === "in_progress");
    const totalSeconds = lessons.reduce((sum, l) => sum + l.durationSeconds, 0);
    return {
      lessons,
      total: lessons.length,
      completedCount,
      hasCurrent,
      totalSeconds,
      /** 「約38分」 */
      durationLabel: `約${Math.round(totalSeconds / 60)}分`,
      isCompleted: lessons.length > 0 && completedCount === lessons.length,
    };
  }

  /**
   * 現在学習中のコース。
   *
   * **受講権限のあるコースだけを返す。**
   * 権限が切れたコースを「学習中」として出しても、受講生は続きを見られない。
   * 「学習を続ける」を押しても弾かれるだけで、壊れているとしか映らない。
   */
  function getInProgressCourses(): Course[] {
    return snapshot.courses.filter(
      (c) => c.isEnrolled && getCourseStatus(c.id) === "in_progress",
    );
  }

  /**
   * TOP のヒーローに出す「現在学習中のコース」。
   *
   * 学習中のコースが無ければ、**受講できるコース**から選ぶ。
   * ここで受講権限を見ないと、招待直後の受講生に
   * 「受講していないコース」がヒーローとして出てしまう
   *（実際に 1 コースだけ付与した受講生で発生した）。
   * どれも受講していない場合だけ、案内として先頭のコースを出す。
   */
  function getPrimaryCourse(): Course {
    return (
      getInProgressCourses()[0] ??
      snapshot.courses.find((c) => c.isEnrolled) ??
      snapshot.courses[0]
    );
  }

  function getFavoriteLessons(): Lesson[] {
    return getLessons(progress.favoriteLessonIds);
  }

  /** 学習履歴を日付グループへまとめる */
  function getHistoryGroups() {
    const groups: { label: string; events: typeof progress.viewEvents }[] = [];
    for (const event of progress.viewEvents) {
      const last = groups[groups.length - 1];
      if (last && last.label === event.dateGroup) {
        last.events.push(event);
      } else {
        groups.push({ label: event.dateGroup, events: [event] });
      }
    }
    return groups;
  }

  return {
    // 教材（Supabase）
    categories: snapshot.categories,
    tools: snapshot.tools,
    toolFilterOrder: snapshot.toolFilterOrder,
    courses: snapshot.courses,
    allChapters: snapshot.chapters,
    allLessons: snapshot.lessons,
    getCourse,
    getLesson,
    getChapter,
    getChaptersByCourse,
    getLessonsByCourse,
    getLessonsByChapter,
    getLessons,
    getCourses,
    getAllLessonsInListOrder,
    getAdjacentLessons,
    getCourseTotalLessons,
    categoryLabel,

    // キュレーション（Claude Design の並び順。将来 DB のフラグへ移せる）
    resumeLessonIds: progress.resumeLessonIds,
    newLessonIds: progress.newLessonIds,
    recommendedCourseIds: progress.recommendedCourseIds,
    videoListOrder: progress.videoListOrder,

    // 進捗（Phase 5 で lesson_progress に差し替え）
    getProgress,
    getLessonStatus,
    getLessonPercent,
    getCoursePercent,
    getCourseCompletedLessons,
    getCourseStatus,
    getChapterStats,
    getResumeLessonId,
    getInProgressCourses,
    getPrimaryCourse,
    getFavoriteLessons,
    getHistoryGroups,
    learningStats: progress.learningStats,
    favoriteLessonIds: progress.favoriteLessonIds,
    viewEvents: progress.viewEvents,
    todayLabel: progress.todayLabel,
  };
}
