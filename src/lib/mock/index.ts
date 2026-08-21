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
 * ■ Phase 6-A でここから消えたもの
 *   お知らせも Supabase が唯一の source of truth になった。
 *     - Server Component … `getAnnouncements()` (@/lib/news/server)
 *     - Client Component … `useAnnouncements()` (@/lib/news/context)
 *     - 表示用の定数     … @/lib/news/presentation
 *
 * ■ ここに残っているもの
 *   - ユーザーのダミー項目（取得元が無いもの）
 *   - 学習進捗の生データ（@/lib/progress/dummy が読む。フォールバック用）
 */

export { currentUser } from "./user";
