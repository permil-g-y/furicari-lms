import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getContentBundle } from "@/lib/content/server";
import type { AdminLesson } from "./lessons";

/**
 * 管理画面用のレッスン取得。
 *
 * 教材の表示情報（コース名・チャプター名）は既にリクエスト内で
 * メモリに載っているスナップショットから引く。
 * 動画の状態だけを lessons テーブルから追加で取る。
 */
async function loadLessons(): Promise<{ lessons: AdminLesson[]; unavailable: string | null }> {
  const [supabase, content] = await Promise.all([createClient(), getContentBundle()]);

  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, slug, is_published, stream_video_id, stream_status, stream_synced_at, stream_error, duration_seconds",
    );

  if (error) {
    // 列がまだ無い（migration 未適用）場合はここで落とさず、その旨を伝える
    if (error.code === "42703" || error.code === "PGRST204") {
      return { lessons: [], unavailable: "動画の状態を保持する列がまだありません（migration 未適用）。" };
    }
    throw new Error(`[admin] レッスンの取得に失敗しました: ${error.message}`);
  }

  const byId = new Map((data ?? []).map((row) => [row.slug, row]));

  const lessons: AdminLesson[] = content.snapshot.lessons.map((lesson) => {
    const row = byId.get(lesson.id);
    const chapter = content.snapshot.chapters.find((c) => c.id === lesson.chapterId);
    const course = content.snapshot.courses.find((c) => c.id === lesson.courseId);
    return {
      id: row?.id ?? lesson.id,
      slug: lesson.id,
      courseId: lesson.courseId,
      courseTitle: course?.title ?? lesson.courseId,
      chapterTitle: chapter?.title ?? "",
      number: lesson.number,
      title: lesson.title,
      isPublished: row?.is_published ?? true,
      streamVideoId: row?.stream_video_id ?? null,
      streamStatus: row?.stream_status ?? null,
      streamSyncedAt: row?.stream_synced_at ?? null,
      streamError: row?.stream_error ?? null,
      durationSeconds: row?.duration_seconds ?? lesson.durationSeconds,
    };
  });

  return { lessons, unavailable: null };
}

export const getAdminLessons = cache(loadLessons);

export async function getAdminLesson(slug: string): Promise<AdminLesson | null> {
  const { lessons } = await getAdminLessons();
  return lessons.find((lesson) => lesson.slug === slug) ?? null;
}
