import type { CourseStatus, LearningStats, LessonProgress, ViewEvent } from "@/lib/types";

/**
 * 進捗系 Server Action の戻り値。
 *
 * "use server" のファイルからは非同期関数以外を export できないため、
 * 型はここに置く（src/lib/auth/state.ts と同じ理由）。
 */
export type ProgressActionResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "not-found" | "failed" };

/**
 * 画面が必要とする学習進捗の一式。
 *
 * ■ 位置づけ
 *   教材（Supabase の courses / chapters / lessons）と対になる「ユーザーごとの状態」。
 *   Content API はこの形だけを見るので、供給元が Supabase でもダミーでも
 *   画面側のコードは変わらない。
 *
 * ■ 供給元
 *   - 通常          … src/lib/progress/server.ts（Supabase 由来）
 *   - フォールバック … src/lib/progress/dummy.ts（マイグレーション未適用時）
 *
 * ■ ID はすべて slug
 *   DB の外部キーは uuid だが、この型に入る ID は必ず slug
 *   （premiere-practice-05 など）。uuid はサーバー側で完結させ、
 *   クライアントへは渡さない。
 */
export type ProgressSource = {
  /** 動画単位の視聴状態。未登録のレッスンは not_started として扱う */
  lessonProgress: LessonProgress[];
  /** コースの受講状態 */
  courseStatus: Record<string, CourseStatus>;
  /** コースごとの視聴済み本数（完了した公開レッスン数） */
  completedLessonsByCourse: Record<string, number>;
  /** 「学習を続ける」の遷移先。最後に視聴したレッスン、無ければ第 1 レッスン */
  nextLessonByCourse: Record<string, string>;
  /** お気に入りの動画。保存日が新しい順 */
  favoriteLessonIds: string[];
  /** お気に入りのコース。保存日が新しい順 */
  favoriteCourseIds: string[];
  /** 学習履歴。新しい順 */
  viewEvents: ViewEvent[];
  /** TOP・学習履歴・マイページで共有する学習サマリー */
  learningStats: LearningStats;
  /** TOP の基準日（"2026年8月19日（水）"） */
  todayLabel: string;
  /** TOP「続きから学ぶ」の並び（視聴途中の動画を新しい順に） */
  resumeLessonIds: string[];

  /* ---- ここから下はキュレーション（進捗ではない / Phase 5 の対象外） ---- */
  /** TOP「新着動画」の並び */
  newLessonIds: string[];
  /** TOP「あなたにおすすめのコース」の並び */
  recommendedCourseIds: string[];
  /** 動画一覧のデフォルト表示順 */
  videoListOrder: string[];
};
