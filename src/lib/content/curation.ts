/**
 * キュレーション情報（運営が決める「見せ方」の並び順）。
 *
 * ■ なぜ進捗から分離したか
 *   Phase 5 で学習進捗を Supabase 由来に差し替えるにあたり、
 *   「ユーザーごとに変わるもの（進捗）」と「全員に同じもの（並び順）」を分けた。
 *   ここにある 3 つは進捗と無関係なので、Phase 5 の対象外として
 *   Claude Design の並びをそのまま維持する。
 *
 * ■ 将来
 *   管理画面（Phase 7）から編集できるよう DB のフラグへ移せるが、
 *   その時もここが唯一の定義場所であることは変わらない。
 *
 * ■ ここに無いもの
 *   TOP「続きから学ぶ」の並び（resumeLessonIds）は
 *   「視聴途中の動画を新しい順に」という進捗そのものなので、
 *   Phase 5 で lesson_progress から導出する。
 */

/** TOP「新着動画」の並び */
export const newLessonIds: string[] = [
  "ai-editing-09",
  "ai-editing-04",
  "premiere-practice-10",
  "ai-client-acquisition-10",
];

/** TOP「あなたにおすすめのコース」の並び */
export const recommendedCourseIds: string[] = [
  "capcut-practice",
  "ai-client-work",
  "ai-editing",
  "ai-client-acquisition",
];

/** 動画一覧のデフォルト表示順（先頭 9 件が Claude Design の 1 ページ目） */
export const videoListOrder: string[] = [
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

/** TOP「続きから学ぶ」に並べる本数（PC は 3 カラムのグリッド） */
export const RESUME_LESSON_LIMIT = 3;
