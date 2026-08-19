/**
 * フリキャリ ドメイン型定義
 *
 * Phase 3 で Supabase へ置き換える前提のため、テーブル設計と 1:1 で対応させている。
 * （courses / chapters / lessons / categories / tools / lesson_progress /
 *   lesson_favorites / course_favorites / announcements / lesson_view_events）
 */

/** 難易度。ラベルは表示箇所で 2 系統あるので getter で出し分ける */
export type Level = "beginner" | "intermediate" | "advanced";

/** 動画（レッスン）の視聴状態 */
export type LessonStatus = "not_started" | "in_progress" | "completed";

/** コースの受講状態 */
export type CourseStatus = "not_started" | "in_progress" | "completed";

/** カテゴリ（全ページ共通の 6 分類。all は絞り込み用の仮想値） */
export type CategoryKey =
  | "all"
  | "video-editing"
  | "ai"
  | "client-acquisition"
  | "sales"
  | "client-work";

/** 使用ツール */
export type ToolKey =
  | "premiere"
  | "aftereffects"
  | "capcut"
  | "davinci"
  | "chatgpt"
  | "claude";

/** お知らせのカテゴリ */
export type AnnouncementCategory =
  | "new_course"
  | "event"
  | "update"
  | "maintenance";

export interface Category {
  key: CategoryKey;
  label: string;
}

/**
 * ツール。サムネイルのグラデーションはデザイン仕様なので DB（tools テーブル）
 * にも同じカラムを持たせる想定。
 */
export interface Tool {
  key: ToolKey;
  /** 正式名称（フィルター等で使用） */
  name: string;
  /** サムネイル左上のバッジ表記 */
  badge: string;
  /** サムネイルのグラデーション開始色 */
  gradientFrom: string;
  /** サムネイルのグラデーション終了色 */
  gradientTo: string;
  /** バッジ文字色 */
  ink: string;
}

/** コースカバー（画像ではなくアイコン + パステル背景で表現される） */
export interface CourseCover {
  /** 背景色 */
  bg: string;
  /** /icons 配下のアイコン名。text が指定された場合はそちらを優先 */
  icon?: string;
  /** アイコンの代わりに表示する文字（"AI" など） */
  text?: string;
  /** text の文字色 */
  textColor?: string;
}

export interface Course {
  id: string;
  title: string;
  /** カード・詳細で使う短い説明 */
  description: string;
  category: CategoryKey;
  level: Level;
  cover: CourseCover;
  /** 総動画本数（Phase 3 では lessons の集計に置き換え） */
  totalLessons: number;
  /** 視聴済み本数 */
  completedLessons: number;
  /** 「約6時間」等の表示用ラベル */
  durationLabel: string;
  status: CourseStatus;
  /** 「学習を続ける」の遷移先（course_state.last_lesson_id 相当） */
  nextLessonId?: string;
  /** このコースで学べること */
  learnPoints?: { title: string; note: string }[];
  sortOrder: number;
}

export interface Chapter {
  id: string;
  courseId: string;
  /** 「Chapter 2」の 2 */
  number: number;
  title: string;
  sortOrder: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  chapterId: string;
  /** カリキュラム上の通し番号（"05" のようにゼロ埋めで表示） */
  number: number;
  title: string;
  /** 動画一覧カードの説明文 */
  description?: string;
  /** 「この動画について」の箇条書き */
  keyPoints?: string[];
  /** 再生時間（秒） */
  durationSeconds: number;
  tool: ToolKey;
  category: CategoryKey;
  level: Level;
  /** Phase 4 で Cloudflare Stream の Video UID に差し替える */
  streamVideoId?: string;
  /** 新着表示用 */
  publishedAt: string;
  sortOrder: number;
}

/** ユーザーごとの視聴状態（lesson_progress テーブル相当） */
export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  /** 再生位置（秒） */
  positionSeconds: number;
}

/** 学習履歴の 1 件（lesson_view_events 相当） */
export interface ViewEvent {
  id: string;
  lessonId: string;
  /** ISO 8601 */
  viewedAt: string;
  /** 一覧に出す「14:20 に視聴」の時刻表記 */
  viewedAtLabel: string;
  /** 日付グループの見出し（今日 / 昨日 / 2026/08/17（日）） */
  dateGroup: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  /** 表示用の日付（2026/08/18） */
  date: string;
  isNew: boolean;
  /** 詳細ページの本文ブロック */
  body?: AnnouncementBlock[];
  /** 詳細ページ下部の関連リンク */
  relatedLinks?: { icon: string; label: string; href: string }[];
}

export type AnnouncementBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; title: string; items: string[] };

export interface User {
  id: string;
  name: string;
  email: string;
  avatarIcon: string;
  /** 「2026年4月10日から利用中」 */
  joinedLabel: string;
  passwordUpdatedAt: string;
  notificationEnabled: boolean;
}

/** ダッシュボード等で使う学習サマリー */
export interface LearningStats {
  completedLessons: number;
  totalWatchTimeLabel: string;
  activeCourses: number;
  completedCourses: number;
  streakDays: number;
  weeklyLessons: number;
}
