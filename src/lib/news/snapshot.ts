import type { Announcement, AnnouncementBlock } from "@/lib/types";
import type { AnnouncementRow } from "@/lib/supabase/database.types";
import { jstDateKey } from "@/lib/content/format";
import { NEW_WITHIN_DAYS } from "./presentation";

/**
 * DB 行 → 画面が使うドメイン型 への変換。
 *
 * ■ 形を変えない
 *   Phase 1 から画面が使ってきた Announcement の形をそのまま保つ。
 *   date（表示用の日付）と isNew（NEW バッジ）は DB に持たせず、
 *   published_at から算出してここで埋める。
 *   おかげで一覧・詳細・TOP の JSX を一切変更せずに実データ化できる。
 *
 * ■ id には uuid ではなく slug を入れる
 *   教材（Phase 3）と同じ方針。/news/ann-01 の URL を維持できる。
 */

const DAY_MS = 86_400_000;

/** "2026-08-18" → "2026/08/18"（日本時間の暦日） */
function toDisplayDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;
  return jstDateKey(date).replace(/-/g, "/");
}

/** 公開からの経過が NEW_WITHIN_DAYS 以内か（未来日の予約公開も NEW 扱い） */
function isNewAnnouncement(publishedAt: string, now: Date): boolean {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  return now.getTime() - published <= NEW_WITHIN_DAYS * DAY_MS;
}

/** jsonb は any 相当で返るため、配列であることだけ確かめて渡す */
export function asBlocks(value: unknown): AnnouncementBlock[] | undefined {
  return Array.isArray(value) && value.length > 0
    ? (value as AnnouncementBlock[])
    : undefined;
}

function asLinks(value: unknown): Announcement["relatedLinks"] {
  return Array.isArray(value) && value.length > 0
    ? (value as NonNullable<Announcement["relatedLinks"]>)
    : undefined;
}

export function buildAnnouncement(row: AnnouncementRow, now: Date): Announcement {
  return {
    id: row.slug,
    title: row.title,
    category: row.category,
    date: toDisplayDate(row.published_at),
    isNew: isNewAnnouncement(row.published_at, now),
    body: asBlocks(row.body),
    relatedLinks: asLinks(row.related_links),
  };
}

/** 公開日の新しい順に整えて返す */
export function buildAnnouncements(rows: AnnouncementRow[], now: Date): Announcement[] {
  return [...rows]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .map((row) => buildAnnouncement(row, now));
}
