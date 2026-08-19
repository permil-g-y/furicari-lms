import type {
  Chapter,
  Course,
  Lesson,
  LessonProgress,
  LessonStatus,
} from "@/lib/types";
import { allChapters, allLessons, courseLongDescription, courses } from "./courses";
import {
  announcementCategoryLabel,
  announcementCategoryStyle,
  announcements,
  currentUser,
  favoriteCourseIds,
  favoriteLessonIds,
  learningStats,
  lessonProgress,
  todayLabel,
  viewEvents,
} from "./user";

export * from "./taxonomy";
export {
  allChapters,
  allLessons,
  courseLongDescription,
  courses,
  announcementCategoryLabel,
  announcementCategoryStyle,
  announcements,
  currentUser,
  favoriteCourseIds,
  favoriteLessonIds,
  learningStats,
  lessonProgress,
  todayLabel,
  viewEvents,
};

/* =========================================================================
   キュレーション（Claude Design 上で手で並べられていた並び順を明示的に保持）
   Phase 3 では DB のフラグ / ソート順に置き換える
   ========================================================================= */

/** TOP「続きから学ぶ」の並び */
export const resumeLessonIds = [
  "premiere-practice-05",
  "capcut-practice-02",
  "ai-editing-05",
];

/** TOP「新着動画」の並び */
export const newLessonIds = [
  "ai-editing-09",
  "ai-editing-04",
  "premiere-practice-10",
  "ai-client-acquisition-10",
];

/** TOP「あなたにおすすめのコース」の並び */
export const recommendedCourseIds = [
  "capcut-practice",
  "ai-client-work",
  "ai-editing",
  "ai-client-acquisition",
];

/** 動画一覧のデフォルト表示順（先頭 9 件が Claude Design の 1 ページ目） */
export const videoListOrder = [
  "premiere-practice-05",
  "premiere-practice-04",
  "premiere-practice-03",
  "premiere-practice-10",
  "ai-editing-09",
  "ai-editing-04",
  "ai-editing-05",
  "capcut-practice-02",
  "ai-client-acquisition-10",
];

/* =========================================================================
   セレクタ
   Phase 3 で Supabase のクエリへ置き換える境界。
   ========================================================================= */

const lessonById = new Map(allLessons.map((l) => [l.id, l]));
const chapterById = new Map(allChapters.map((c) => [c.id, c]));
const courseById = new Map(courses.map((c) => [c.id, c]));
const progressById = new Map(lessonProgress.map((p) => [p.lessonId, p]));

export function getCourse(courseId: string): Course | undefined {
  return courseById.get(courseId);
}

export function getLesson(lessonId: string): Lesson | undefined {
  return lessonById.get(lessonId);
}

export function getChapter(chapterId: string): Chapter | undefined {
  return chapterById.get(chapterId);
}

export function getChaptersByCourse(courseId: string): Chapter[] {
  return allChapters
    .filter((c) => c.courseId === courseId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLessonsByCourse(courseId: string): Lesson[] {
  return allLessons
    .filter((l) => l.courseId === courseId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLessonsByChapter(chapterId: string): Lesson[] {
  return allLessons
    .filter((l) => l.chapterId === chapterId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLessons(ids: string[]): Lesson[] {
  return ids.map((id) => lessonById.get(id)).filter((l): l is Lesson => !!l);
}

export function getCourses(ids: string[]): Course[] {
  return ids.map((id) => courseById.get(id)).filter((c): c is Course => !!c);
}

/* ---- 進捗 ---------------------------------------------------------- */

export function getProgress(lessonId: string): LessonProgress {
  return (
    progressById.get(lessonId) ?? {
      lessonId,
      status: "not_started",
      positionSeconds: 0,
    }
  );
}

export function getLessonStatus(lessonId: string): LessonStatus {
  return getProgress(lessonId).status;
}

/** 動画単位の視聴率（0-100） */
export function getLessonPercent(lessonId: string): number {
  const lesson = lessonById.get(lessonId);
  const progress = getProgress(lessonId);
  if (!lesson) return 0;
  if (progress.status === "completed") return 100;
  if (progress.status === "not_started") return 0;
  return Math.round((progress.positionSeconds / lesson.durationSeconds) * 100);
}

/** コースの進捗率（0-100）。本数は course レコードの値を正とする */
export function getCoursePercent(course: Course): number {
  if (course.totalLessons === 0) return 0;
  return Math.round((course.completedLessons / course.totalLessons) * 100);
}

/** チャプター単位の集計（アコーディオンのメタ表示用） */
export function getChapterStats(chapterId: string) {
  const lessons = getLessonsByChapter(chapterId);
  const completedCount = lessons.filter(
    (l) => getLessonStatus(l.id) === "completed",
  ).length;
  const hasCurrent = lessons.some(
    (l) => getLessonStatus(l.id) === "in_progress",
  );
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

/** コース内での前後の動画 */
export function getAdjacentLessons(lessonId: string): {
  prev?: Lesson;
  next?: Lesson;
} {
  const lesson = lessonById.get(lessonId);
  if (!lesson) return {};
  const siblings = getLessonsByCourse(lesson.courseId);
  const index = siblings.findIndex((l) => l.id === lessonId);
  return {
    prev: index > 0 ? siblings[index - 1] : undefined,
    next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined,
  };
}

/** 「学習を続ける」の遷移先 */
export function getResumeLessonId(course: Course): string {
  return course.nextLessonId ?? getLessonsByCourse(course.id)[0]?.id ?? "";
}

/* ---- 一覧系 --------------------------------------------------------- */

/** 現在学習中のコース（TOP のヒーロー・マイページで使用） */
export function getInProgressCourses(): Course[] {
  return courses.filter((c) => c.status === "in_progress");
}

/** TOP のヒーローに出す「現在学習中のコース」 */
export function getPrimaryCourse(): Course {
  return getInProgressCourses()[0] ?? courses[0];
}

export function getFavoriteLessons(): Lesson[] {
  return getLessons(favoriteLessonIds);
}

/** 動画一覧のデフォルト順（キュレーション 9 件 → 残り全件） */
export function getAllLessonsInListOrder(): Lesson[] {
  const curated = getLessons(videoListOrder);
  const curatedIds = new Set(videoListOrder);
  const rest = allLessons.filter((l) => !curatedIds.has(l.id));
  return [...curated, ...rest];
}

/** 学習履歴を日付グループへまとめる */
export function getHistoryGroups() {
  const groups: { label: string; events: typeof viewEvents }[] = [];
  for (const event of viewEvents) {
    const last = groups[groups.length - 1];
    if (last && last.label === event.dateGroup) {
      last.events.push(event);
    } else {
      groups.push({ label: event.dateGroup, events: [event] });
    }
  }
  return groups;
}

export function getAnnouncement(id: string) {
  return announcements.find((a) => a.id === id);
}

/** お知らせ詳細の「次のお知らせ」 */
export function getNextAnnouncement(id: string) {
  const index = announcements.findIndex((a) => a.id === id);
  return index >= 0 && index < announcements.length - 1
    ? announcements[index + 1]
    : undefined;
}
