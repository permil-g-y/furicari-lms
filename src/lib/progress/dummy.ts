import {
  favoriteCourseIds,
  favoriteLessonIds,
  learningStats,
  lessonProgress,
  todayLabel,
  viewEvents,
} from "@/lib/mock/user";
import {
  newLessonIds,
  recommendedCourseIds,
  videoListOrder,
} from "@/lib/content/curation";
import type { ProgressSource } from "./types";

/**
 * 学習進捗のダミーデータ。
 *
 * ■ いつ使われるか
 *   マイグレーション未適用など、Supabase から教材を取得できないときの
 *   **開発用フォールバック専用**（src/lib/content/mock-fallback.ts と対になる）。
 *   通常の経路では src/lib/progress/server.ts が Supabase から組み立てる。
 *
 * ■ 値の意味
 *   Claude Design の画面に出ていた表示（「44%」「18本中8本」など）を
 *   再現するための固定値。実際の視聴状況とは無関係。
 *   src/lib/content/content.test.ts はこの値を基準に
 *   「教材と進捗の境界」を検証しているため、値を変えるとテストが落ちる。
 */
export const dummyProgress: ProgressSource = {
  lessonProgress,
  favoriteLessonIds,
  favoriteCourseIds,
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

  // キュレーションは進捗ではないので、実データ経路と同じ定義を共有する
  newLessonIds,
  recommendedCourseIds,
  videoListOrder,
};
