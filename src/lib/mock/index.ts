/**
 * まだ DB 化していないダミーデータの入口。
 *
 * ■ Phase 3 でここから消えたもの
 *   コース / チャプター / レッスン / カテゴリ / ツールの取得は
 *   **Supabase が唯一の source of truth** になった。
 *   画面からは以下を使うこと:
 *     - Server Component … `getContent()`      (@/lib/content/server)
 *     - Client Component … `useContent()`      (@/lib/content/context)
 *     - 純粋なフォーマッタ … @/lib/content/format
 *
 *   誤って古い経路に戻らないよう、教材セレクタはここから re-export しない。
 *   （マイグレーション未適用時のフォールバックだけが
 *     @/lib/mock/courses・@/lib/mock/taxonomy を直接読む）
 *
 * ■ ここに残っているもの
 *   - お知らせ（Phase 6 で DB 化）
 *   - ユーザーのダミー項目（パスワード最終更新日など、取得元が無いもの）
 *   - 学習進捗の生データ（@/lib/progress/dummy が読む。Phase 5 で DB 化）
 */

export {
  announcementCategoryLabel,
  announcementCategoryStyle,
  announcements,
  currentUser,
} from "./user";

import { announcements } from "./user";

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
