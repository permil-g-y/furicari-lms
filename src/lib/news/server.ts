import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/user";
import type { Announcement } from "@/lib/types";
import { buildAnnouncements } from "./snapshot";

/**
 * お知らせの取得（Supabase が唯一の source of truth）。
 *
 * 件数が小さいので 1 リクエストにつき 1 回だけ全件取得し、
 * React の cache() で同一リクエスト内は 1 回に集約する（教材・進捗と同じ方針）。
 *
 * 受講生に見えるのは「公開済み かつ 公開日時を過ぎたもの」だけ。
 * その絞り込みは RLS が行うので、ここでは条件を書かない
 * （書くと admin が下書きを見られなくなる）。
 */

/** テーブル未作成（マイグレーション未適用）を表す PostgREST のコード */
const TABLE_MISSING = "PGRST205";

let warnedMissing = false;

export type AnnouncementBundle = {
  announcements: Announcement[];
  /** 未読のお知らせ件数（ヘッダーのドット表示に使う） */
  unreadCount: number;
  /** Supabase から取得できたか（false なら未適用） */
  fromDatabase: boolean;
};

async function loadAnnouncements(): Promise<AnnouncementBundle> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false });

  if (error?.code === TABLE_MISSING) {
    // マイグレーション未適用でも画面を止めない。本番では入らない想定なので警告を出す。
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn(
        "[news] announcements テーブルが見つかりません。お知らせは空として扱います。" +
          " supabase/migrations/20260821200000_create_announcements.sql を適用してください。",
      );
    }
    return { announcements: [], unreadCount: 0, fromDatabase: false };
  }

  if (error) {
    // 権限エラーなど、握りつぶすと原因が分からなくなる失敗はそのまま投げる
    throw new Error(`[news] お知らせの取得に失敗しました: ${error.message} (${error.code})`);
  }

  const rows = data ?? [];
  const announcements = buildAnnouncements(rows, new Date());

  /*
   * 未読件数 = 公開済み件数 − 既読件数。
   * 「行が無い＝未読」なので、既読の集合との差で求める。
   * admin には下書き・予約分も見えるが、それらは未読件数に数えない
   * （公開前のものを「未読」と言われても意味がないため）。
   */
  const visibleIds = new Set(
    rows.filter((row) => row.is_published && Date.parse(row.published_at) <= Date.now())
      .map((row) => row.id),
  );

  let unreadCount = visibleIds.size;
  const user = await getAuthUser();
  if (user && visibleIds.size > 0) {
    const { data: reads } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id);
    const readCount = (reads ?? []).filter((r) => visibleIds.has(r.announcement_id)).length;
    unreadCount = Math.max(0, visibleIds.size - readCount);
  }

  return { announcements, unreadCount, fromDatabase: true };
}

/** 同一リクエスト内では 1 回しか実行されない */
export const getAnnouncementBundle = cache(loadAnnouncements);

/** Server Component からお知らせを引くときの入口 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return (await getAnnouncementBundle()).announcements;
}

/** ヘッダーのドット表示に使う未読件数 */
export async function getUnreadAnnouncementCount(): Promise<number> {
  return (await getAnnouncementBundle()).unreadCount;
}

/** slug でお知らせを 1 件引く */
export async function getAnnouncement(slug: string): Promise<Announcement | undefined> {
  const list = await getAnnouncements();
  return list.find((item) => item.id === slug);
}

/** 詳細ページ下部の「次のお知らせ」（公開日が 1 つ古いもの） */
export async function getNextAnnouncement(slug: string): Promise<Announcement | undefined> {
  const list = await getAnnouncements();
  const index = list.findIndex((item) => item.id === slug);
  return index >= 0 && index < list.length - 1 ? list[index + 1] : undefined;
}
