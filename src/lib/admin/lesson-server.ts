import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AdminLesson } from "./lessons";

/**
 * 管理画面のレッスン取得。
 *
 * ■ 受講生向けの教材スナップショットを使わない
 *   getContentBundle() は **公開中の教材だけ**を返す（受講生が見るものと同じ）。
 *   管理画面はそこから漏れる下書きこそ見たいので、DB を直接引く。
 *   スナップショットを流用すると「下書きにしたレッスンが管理画面から消える」
 *   という、一番困る形の不具合になる。
 *
 * ■ admin は RLS で全件読める
 *   courses / lessons の RLS は `is_published or is_admin()`。
 */
type Row = {
  id: string;
  slug: string;
  number: number;
  title: string;
  course_id: string;
  chapter_id: string;
  is_published: boolean;
  duration_seconds: number;
  stream_video_id: string | null;
  stream_status: AdminLesson["streamStatus"];
  stream_synced_at: string | null;
  stream_error: string | null;
  sort_order: number;
};

async function loadLessons(): Promise<{ lessons: AdminLesson[]; unavailable: string | null }> {
  const supabase = await createClient();

  const [lessonsResult, coursesResult, chaptersResult] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id, slug, number, title, course_id, chapter_id, is_published, duration_seconds, stream_video_id, stream_status, stream_synced_at, stream_error, sort_order",
      )
      .order("sort_order"),
    supabase.from("courses").select("id, slug, title, sort_order").order("sort_order"),
    supabase.from("chapters").select("id, title"),
  ]);

  if (lessonsResult.error) {
    // 列がまだ無い（migration 未適用）場合はここで落とさず、その旨を伝える
    if (lessonsResult.error.code === "42703" || lessonsResult.error.code === "PGRST204") {
      return {
        lessons: [],
        unavailable: "動画の状態を保持する列がまだありません（migration 未適用）。",
      };
    }
    throw new Error(`[admin] レッスンの取得に失敗しました: ${lessonsResult.error.message}`);
  }
  if (coursesResult.error || chaptersResult.error) {
    throw new Error(
      `[admin] コース情報の取得に失敗しました: ${(coursesResult.error ?? chaptersResult.error)?.message}`,
    );
  }

  // uuid → 表示名。コースは slug も持つ（画面の絞り込みに使う）
  const courseById = new Map(
    (coursesResult.data ?? []).map((c) => [c.id, { slug: c.slug, title: c.title }]),
  );
  const chapterTitleById = new Map(
    (chaptersResult.data ?? []).map((c) => [c.id, c.title]),
  );

  const lessons: AdminLesson[] = ((lessonsResult.data ?? []) as Row[]).map((row) => {
    const course = courseById.get(row.course_id);
    return {
      id: row.id,
      slug: row.slug,
      courseId: course?.slug ?? row.course_id,
      courseTitle: course?.title ?? "(コース不明)",
      chapterTitle: chapterTitleById.get(row.chapter_id) ?? "",
      number: row.number,
      title: row.title,
      isPublished: row.is_published,
      streamVideoId: row.stream_video_id,
      streamStatus: row.stream_status,
      streamSyncedAt: row.stream_synced_at,
      streamError: row.stream_error,
      durationSeconds: row.duration_seconds,
    };
  });

  return { lessons, unavailable: null };
}

export const getAdminLessons = cache(loadLessons);

export async function getAdminLesson(slug: string): Promise<AdminLesson | null> {
  const { lessons } = await getAdminLessons();
  return lessons.find((lesson) => lesson.slug === slug) ?? null;
}
