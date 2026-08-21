import type {
  CourseStatus,
  LearningStats,
  LessonProgress,
  LessonStatus,
  ViewEvent,
} from "@/lib/types";
import {
  countStreakDays,
  formatWatchTime,
  jstDateGroupLabel,
  jstDateKey,
  jstTimeLabel,
  jstTodayLabel,
} from "@/lib/content/format";
import {
  RESUME_LESSON_LIMIT,
  newLessonIds,
  recommendedCourseIds,
  videoListOrder,
} from "@/lib/content/curation";
import type { ProgressSource } from "./types";

/**
 * 学習進捗の集計。
 *
 * Supabase にも React にも依存しない純粋関数として書いてある。
 * 進捗率・連続学習日数・総学習時間といった「間違えると気付きにくい計算」を
 * ここへ集め、テストで固定するのが狙い。
 *
 * 入力の ID はすべて slug。uuid との変換は呼び出し側（server.ts）の責務。
 */

/** DB の 1 行を slug 空間へ写したもの */
export type ProgressRecord = {
  lessonId: string;
  status: LessonStatus;
  positionSeconds: number;
  /** 未完了なら null */
  completedAt: string | null;
  lastViewedAt: string;
};

export type ViewEventRecord = {
  id: string;
  lessonId: string;
  viewedAt: string;
};

/** 集計に必要な最小限の教材情報 */
export type LessonMeta = {
  id: string;
  courseId: string;
  durationSeconds: number;
};

const WEEK_MS = 7 * 86_400_000;

/** ISO 日時 → 比較用のミリ秒。壊れた値は 0 として扱い、順序だけ狂わせない */
function time(iso: string | null): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

export function buildProgressSource(input: {
  /** 表示順（コースの並び → コース内の並び）に整列済みのレッスン */
  lessons: LessonMeta[];
  /** 表示順に整列済みのコース slug */
  courseIds: string[];
  records: ProgressRecord[];
  viewEvents: ViewEventRecord[];
  /** 保存日が新しい順 */
  favoriteLessonIds: string[];
  /** 保存日が新しい順 */
  favoriteCourseIds: string[];
  now: Date;
}): ProgressSource {
  const { lessons, courseIds, records, viewEvents, now } = input;

  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  /*
   * 教材スナップショットに無いレッスンの記録は捨てる。
   * 非公開に戻されたレッスンや削除されたレッスンの進捗が
   * 集計に混ざって件数が合わなくなるのを防ぐ。
   */
  const valid = records.filter((r) => lessonById.has(r.lessonId));
  const recordByLesson = new Map(valid.map((r) => [r.lessonId, r]));

  const lessonsByCourse = new Map<string, LessonMeta[]>();
  for (const lesson of lessons) {
    const list = lessonsByCourse.get(lesson.courseId) ?? [];
    list.push(lesson);
    lessonsByCourse.set(lesson.courseId, list);
  }

  /* ---- 動画単位の視聴状態 ------------------------------------------- */

  const lessonProgress: LessonProgress[] = valid.map((r) => ({
    lessonId: r.lessonId,
    status: r.status,
    // 尺を超える位置が入っていても 100% を超えて表示しない
    positionSeconds: Math.min(
      r.positionSeconds,
      lessonById.get(r.lessonId)?.durationSeconds ?? r.positionSeconds,
    ),
  }));

  /* ---- コース単位の集計 --------------------------------------------- */

  const completedLessonsByCourse: Record<string, number> = {};
  const courseStatus: Record<string, CourseStatus> = {};
  const nextLessonByCourse: Record<string, string> = {};

  for (const courseId of courseIds) {
    const courseLessons = lessonsByCourse.get(courseId) ?? [];

    let completed = 0;
    let touched = 0;
    let latest: ProgressRecord | undefined;

    for (const lesson of courseLessons) {
      const record = recordByLesson.get(lesson.id);
      if (!record) continue;
      touched++;
      if (record.status === "completed") completed++;
      if (!latest || time(record.lastViewedAt) > time(latest.lastViewedAt)) {
        latest = record;
      }
    }

    // 進捗率は「完了した公開レッスン数 ÷ 公開レッスン総数」。
    // スナップショットには RLS により公開レッスンしか入らないので、
    // courseLessons.length がそのまま公開レッスン総数になる。
    completedLessonsByCourse[courseId] = completed;

    if (courseLessons.length > 0 && completed === courseLessons.length) {
      courseStatus[courseId] = "completed";
    } else if (touched > 0) {
      courseStatus[courseId] = "in_progress";
    } else {
      courseStatus[courseId] = "not_started";
    }

    // 「学習を続ける」は最後に視聴したレッスンへ。未視聴なら第 1 レッスン。
    const next = latest?.lessonId ?? courseLessons[0]?.id;
    if (next) nextLessonByCourse[courseId] = next;
  }

  /* ---- TOP「続きから学ぶ」 ------------------------------------------ */

  const resumeLessonIds = valid
    .filter((r) => r.status === "in_progress")
    .sort((a, b) => time(b.lastViewedAt) - time(a.lastViewedAt))
    .slice(0, RESUME_LESSON_LIMIT)
    .map((r) => r.lessonId);

  /* ---- 学習履歴 ------------------------------------------------------ */

  const events: ViewEvent[] = viewEvents
    .filter((e) => lessonById.has(e.lessonId))
    .sort((a, b) => time(b.viewedAt) - time(a.viewedAt))
    .map((e) => {
      const at = new Date(e.viewedAt);
      return {
        id: e.id,
        lessonId: e.lessonId,
        viewedAt: e.viewedAt,
        viewedAtLabel: jstTimeLabel(at),
        dateGroup: jstDateGroupLabel(at, now),
      };
    });

  /* ---- 学習サマリー -------------------------------------------------- */

  const statuses = Object.values(courseStatus);
  const weekAgo = now.getTime() - WEEK_MS;

  /*
   * 総学習時間は「到達した最も先の位置」の合計。
   * 巻き戻しても減らず、同じ動画を 2 回見ても二重計上されない。
   *
   * 完了したレッスンは尺いっぱいとして数える。
   * 「視聴済みにする」で完了したときに再生位置が 0 のままでも
   * 「1 本学習済みなのに 0 分」にならないようにするため。
   * 完了を取り消せば、その時点の実際の到達位置に自然と戻る。
   */
  const totalWatchSeconds = valid.reduce((sum, r) => {
    const duration = lessonById.get(r.lessonId)?.durationSeconds ?? 0;
    return sum + (r.status === "completed" ? duration : Math.min(r.positionSeconds, duration));
  }, 0);

  const learningStats: LearningStats = {
    completedLessons: valid.filter((r) => r.status === "completed").length,
    totalWatchTimeLabel: formatWatchTime(totalWatchSeconds),
    activeCourses: statuses.filter((s) => s === "in_progress").length,
    completedCourses: statuses.filter((s) => s === "completed").length,
    streakDays: countStreakDays(
      events.map((e) => jstDateKey(new Date(e.viewedAt))),
      now,
    ),
    weeklyLessons: valid.filter(
      (r) => r.completedAt !== null && time(r.completedAt) >= weekAgo,
    ).length,
  };

  return {
    lessonProgress,
    courseStatus,
    completedLessonsByCourse,
    nextLessonByCourse,
    favoriteLessonIds: input.favoriteLessonIds.filter((id) => lessonById.has(id)),
    favoriteCourseIds: input.favoriteCourseIds.filter((id) => courseIds.includes(id)),
    viewEvents: events,
    learningStats,
    todayLabel: jstTodayLabel(now),
    resumeLessonIds,

    // キュレーション（Phase 5 の対象外。Claude Design の並びを維持）
    newLessonIds,
    recommendedCourseIds,
    videoListOrder,
  };
}
