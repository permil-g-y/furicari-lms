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
 * ■ Phase 6-D でここから消えたもの
 *   マイページのユーザー情報はすべて Supabase Auth / profiles の実データになった。
 *   （表示名・メール・通知設定。パスワード最終更新日は取得元が無いため表示自体を廃止）
 *
 * ■ ここに残っているもの
 *   学習進捗の生データだけ（@/lib/progress/dummy が読む。
 *   マイグレーション未適用時のフォールバック専用）。
 */

export {};
