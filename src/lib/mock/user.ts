import type {
  Announcement,
  LearningStats,
  LessonProgress,
  User,
  ViewEvent,
} from "@/lib/types";
import { ms } from "./taxonomy";

/** ログイン中のユーザー（Phase 2 で Supabase Auth の session に置き換え） */
export const currentUser: User = {
  id: "user-yuki",
  name: "ゆうき",
  email: "yuki.freelance@example.com",
  avatarIcon: "icon-user",
  joinedLabel: "2026年4月10日から利用中",
  passwordUpdatedAt: "2026/06/12",
  notificationEnabled: true,
};

/** TOP に表示する基準日（Claude Design のダミー値） */
export const todayLabel = "2026年8月19日（水）";

export const learningStats: LearningStats = {
  completedLessons: 32,
  totalWatchTimeLabel: "14時間20分",
  activeCourses: 2,
  completedCourses: 1,
  streakDays: 6,
  weeklyLessons: 5,
};

/* ------------------------------------------------------------------ *
 * 視聴状態（lesson_progress 相当）
 * 未登録のレッスンは not_started として扱う
 * ------------------------------------------------------------------ */
function completed(lessonId: string, durationSeconds: number): LessonProgress {
  return { lessonId, status: "completed", positionSeconds: durationSeconds };
}

export const lessonProgress: LessonProgress[] = [
  // Premiere Pro 実践コース
  completed("premiere-practice-01", ms(4, 20)),
  completed("premiere-practice-02", ms(6, 5)),
  completed("premiere-practice-03", ms(8, 30)),
  completed("premiere-practice-04", ms(9, 15)),
  {
    lessonId: "premiere-practice-05",
    status: "in_progress",
    positionSeconds: ms(7, 52), // 07:52 / 12:45 = 62%
  },
  // AI動画編集 効率化コース
  completed("ai-editing-01", ms(6, 20)),
  completed("ai-editing-02", ms(7, 10)),
  completed("ai-editing-03", ms(5, 50)),
  {
    lessonId: "ai-editing-05",
    status: "in_progress",
    positionSeconds: ms(6, 36), // 06:36 / 08:15 = 80%
  },
  // 動画編集 基礎コース（全12本 完了）
  completed("editing-basic-01", ms(5, 10)),
  completed("editing-basic-02", ms(6, 30)),
  completed("editing-basic-03", ms(7, 20)),
  completed("editing-basic-04", ms(8, 40)),
  completed("editing-basic-05", ms(7, 50)),
  completed("editing-basic-06", ms(9, 10)),
  completed("editing-basic-07", ms(6, 45)),
  completed("editing-basic-08", ms(5, 55)),
  completed("editing-basic-09", ms(8, 5)),
  completed("editing-basic-10", ms(6, 20)),
  completed("editing-basic-11", ms(7, 35)),
  completed("editing-basic-12", ms(5, 45)),
  // CapCut 実践コース
  {
    lessonId: "capcut-practice-02",
    status: "in_progress",
    positionSeconds: ms(2, 56), // 02:56 / 10:30 = 28%
  },
];

/** お気に入り登録済みの動画（lesson_favorites 相当） */
export const favoriteLessonIds: string[] = [
  "premiere-practice-05",
  "premiere-practice-10",
  "ai-editing-04",
  "ai-editing-05",
  "ai-editing-09",
  "ai-client-acquisition-10",
];

/** お気に入り登録済みのコース（course_favorites 相当） */
export const favoriteCourseIds: string[] = [];

/* ------------------------------------------------------------------ *
 * 学習履歴（lesson_view_events 相当）
 * ------------------------------------------------------------------ */
export const viewEvents: ViewEvent[] = [
  {
    id: "ev-1",
    lessonId: "premiere-practice-05",
    viewedAt: "2026-08-19T14:20:00+09:00",
    viewedAtLabel: "14:20",
    dateGroup: "今日",
  },
  {
    id: "ev-2",
    lessonId: "premiere-practice-04",
    viewedAt: "2026-08-18T21:05:00+09:00",
    viewedAtLabel: "21:05",
    dateGroup: "昨日",
  },
  {
    id: "ev-3",
    lessonId: "ai-editing-05",
    viewedAt: "2026-08-18T20:12:00+09:00",
    viewedAtLabel: "20:12",
    dateGroup: "昨日",
  },
  {
    id: "ev-4",
    lessonId: "premiere-practice-03",
    viewedAt: "2026-08-17T10:48:00+09:00",
    viewedAtLabel: "10:48",
    dateGroup: "2026/08/17（日）",
  },
  {
    id: "ev-5",
    lessonId: "capcut-practice-02",
    viewedAt: "2026-08-17T09:30:00+09:00",
    viewedAtLabel: "09:30",
    dateGroup: "2026/08/17（日）",
  },
  {
    id: "ev-6",
    lessonId: "premiere-practice-02",
    viewedAt: "2026-08-15T22:40:00+09:00",
    viewedAtLabel: "22:40",
    dateGroup: "2026/08/15（金）",
  },
  {
    id: "ev-7",
    lessonId: "premiere-practice-01",
    viewedAt: "2026-08-15T22:33:00+09:00",
    viewedAtLabel: "22:33",
    dateGroup: "2026/08/15（金）",
  },
];

/* ------------------------------------------------------------------ *
 * お知らせ
 * ------------------------------------------------------------------ */
export const announcements: Announcement[] = [
  {
    id: "ann-01",
    title: "「AI動画編集 効率化コース」に新しいChapterを追加しました",
    category: "new_course",
    date: "2026/08/18",
    isNew: true,
    body: [
      { type: "paragraph", text: "いつもフリキャリをご利用いただきありがとうございます。" },
      {
        type: "paragraph",
        text: "このたび「AI動画編集 効率化コース」に、新しいChapterを追加しました。",
      },
      { type: "heading", text: "追加した内容" },
      {
        type: "paragraph",
        text: "今回追加したChapter 4では、AIを使った素材整理と、テロップ作成の自動化を扱います。これまで手作業で行っていた文字起こし・要約・カット候補の抽出を、AIツールに任せる流れを実際の画面で解説しています。",
      },
      {
        type: "callout",
        title: "Chapter 4　AIで編集を自動化する（全4本・約1時間20分）",
        items: [
          "・AIによる素材の自動タグ付け",
          "・文字起こしから字幕データを一括生成する",
          "・カット候補の抽出とチェックのコツ",
          "・自動化しない方がよい作業の見極め方",
        ],
      },
      { type: "heading", text: "受講中の方へ" },
      {
        type: "paragraph",
        text: "すでに受講中の方は、追加費用なしでそのままご視聴いただけます。学習進捗は引き継がれますので、続きから学習を進めてください。",
      },
      {
        type: "paragraph",
        text: "ご不明な点がありましたら、お問い合わせフォームよりご連絡ください。",
      },
    ],
    relatedLinks: [
      { icon: "icon-book", label: "AI動画編集 効率化コースを見る", href: "/courses/ai-editing" },
      { icon: "icon-film", label: "追加された動画を一覧で確認する", href: "/videos" },
    ],
  },
  {
    id: "ann-02",
    title: "8月の質問会（オンライン）の開催日程についてのご案内",
    category: "event",
    date: "2026/08/11",
    isNew: false,
  },
  {
    id: "ann-03",
    title: "学習履歴ページの表示速度を改善しました",
    category: "update",
    date: "2026/08/04",
    isNew: false,
  },
  {
    id: "ann-04",
    title: "「AI × クライアントワークコース」を公開しました",
    category: "new_course",
    date: "2026/07/28",
    isNew: false,
  },
  {
    id: "ann-05",
    title: "動画プレイヤーに再生速度の変更機能を追加しました",
    category: "update",
    date: "2026/07/21",
    isNew: false,
  },
  {
    id: "ann-06",
    title: "7月20日（月）深夜のシステムメンテナンスのお知らせ",
    category: "maintenance",
    date: "2026/07/14",
    isNew: false,
  },
  {
    id: "ann-07",
    title: "受講生限定・ポートフォリオ添削会のお知らせ",
    category: "event",
    date: "2026/07/07",
    isNew: false,
  },
  {
    id: "ann-08",
    title: "お気に入り機能を追加しました",
    category: "update",
    date: "2026/06/30",
    isNew: false,
  },
];

export const announcementCategoryLabel: Record<
  Announcement["category"],
  string
> = {
  new_course: "新着コース",
  event: "イベント",
  update: "アップデート",
  maintenance: "メンテナンス",
};

/** お知らせカテゴリのバッジ配色（Claude Design の実値） */
export const announcementCategoryStyle: Record<
  Announcement["category"],
  { bg: string; color: string; border?: string }
> = {
  new_course: { bg: "#EAF4FF", color: "#2C7BE0" },
  event: { bg: "#FFF0F3", color: "#D45570" },
  update: { bg: "#E9F7F1", color: "#2E9367" },
  maintenance: { bg: "#F4F8FF", color: "#5B6B85", border: "#E6EEFA" },
};
