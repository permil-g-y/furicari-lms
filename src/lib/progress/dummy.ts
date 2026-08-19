import type { CourseStatus, LearningStats, LessonProgress, ViewEvent } from "@/lib/types";
import {
  favoriteLessonIds,
  learningStats,
  lessonProgress,
  todayLabel,
  viewEvents,
} from "@/lib/mock/user";

/**
 * 学習進捗のダミーデータ。
 *
 * ■ Phase 3 の境界
 *   教材（コース / チャプター / レッスン）は Supabase が唯一の source of truth。
 *   一方でここにある「進捗」は **まだダミー** で、Phase 5 で
 *   lesson_progress / course_state テーブルへ差し替える。
 *
 * ■ Phase 5 での差し替え方
 *   このファイルが公開している DummyProgressSource と同じ形を
 *   Supabase から組み立てて createContentApi に渡すだけでよい。
 *   画面側のコードは変更不要。
 */
export type DummyProgressSource = {
  /** 動画単位の視聴状態 */
  lessonProgress: LessonProgress[];
  /** コースの受講状態 */
  courseStatus: Record<string, CourseStatus>;
  /**
   * コースの視聴済み本数。
   * Claude Design 上の表示（「18本中 8本」など）を再現するための固定値。
   * Phase 5 では lesson_progress の集計に置き換わる。
   */
  completedLessonsByCourse: Record<string, number>;
  /** 「学習を続ける」の遷移先 */
  nextLessonByCourse: Record<string, string>;
  favoriteLessonIds: string[];
  viewEvents: ViewEvent[];
  learningStats: LearningStats;
  todayLabel: string;
  /** TOP「続きから学ぶ」の並び */
  resumeLessonIds: string[];
  /** TOP「新着動画」の並び */
  newLessonIds: string[];
  /** TOP「あなたにおすすめのコース」の並び */
  recommendedCourseIds: string[];
  /** 動画一覧のデフォルト表示順（先頭 9 件が Claude Design の 1 ページ目） */
  videoListOrder: string[];
};

export const dummyProgress: DummyProgressSource = {
  lessonProgress,
  favoriteLessonIds,
  viewEvents,
  learningStats,
  todayLabel,

  courseStatus: {
    "premiere-practice": "in_progress",
    "editing-basic": "completed",
    "ai-editing": "in_progress",
    "capcut-practice": "not_started",
    "ai-client-acquisition": "not_started",
    "ai-client-work": "not_started",
  },

  completedLessonsByCourse: {
    "premiere-practice": 8,
    "editing-basic": 12,
    "ai-editing": 3,
    "capcut-practice": 0,
    "ai-client-acquisition": 0,
    "ai-client-work": 0,
  },

  nextLessonByCourse: {
    "premiere-practice": "premiere-practice-05",
    "editing-basic": "editing-basic-01",
    "ai-editing": "ai-editing-04",
    "capcut-practice": "capcut-practice-01",
    "ai-client-acquisition": "ai-client-acquisition-01",
    "ai-client-work": "ai-client-work-01",
  },

  resumeLessonIds: ["premiere-practice-05", "capcut-practice-02", "ai-editing-05"],

  newLessonIds: [
    "ai-editing-09",
    "ai-editing-04",
    "premiere-practice-10",
    "ai-client-acquisition-10",
  ],

  recommendedCourseIds: [
    "capcut-practice",
    "ai-client-work",
    "ai-editing",
    "ai-client-acquisition",
  ],

  videoListOrder: [
    "premiere-practice-05",
    "premiere-practice-04",
    "premiere-practice-03",
    "premiere-practice-10",
    "ai-editing-09",
    "ai-editing-04",
    "ai-editing-05",
    "capcut-practice-02",
    "ai-client-acquisition-10",
  ],
};
