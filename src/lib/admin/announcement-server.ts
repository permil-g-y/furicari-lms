import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AnnouncementBlock, AnnouncementCategory } from "@/lib/types";
import { asBlocks } from "@/lib/news/snapshot";

/** 管理画面で扱うお知らせ 1 件（下書き・公開予定も含む） */
export type AdminAnnouncement = {
  id: string;
  slug: string;
  title: string;
  category: AnnouncementCategory;
  publishedAt: string;
  isPublished: boolean;
  body: AnnouncementBlock[];
  updatedAt: string;
};

/**
 * 管理画面のお知らせ取得。
 *
 * 受講生向けの getAnnouncements() は「公開済みのみ」を返すため使えない。
 * admin は RLS の "Admins manage announcements" で全件読める。
 */
async function loadAll(): Promise<AdminAnnouncement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, slug, title, category, body, published_at, is_published, updated_at")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`[admin] お知らせの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    publishedAt: row.published_at,
    isPublished: row.is_published,
    body: asBlocks(row.body) ?? [],
    updatedAt: row.updated_at,
  }));
}

export const getAdminAnnouncements = cache(loadAll);

export async function getAdminAnnouncement(
  slug: string,
): Promise<AdminAnnouncement | null> {
  const all = await getAdminAnnouncements();
  return all.find((a) => a.slug === slug) ?? null;
}
