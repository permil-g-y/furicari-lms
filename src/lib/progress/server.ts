import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ContentIdMaps } from "@/lib/content/snapshot";
import {
  buildProgressSource,
  type LessonMeta,
  type ProgressRecord,
  type ViewEventRecord,
} from "./compute";
import type { ProgressSource } from "./types";

/**
 * 学習進捗の取得（Supabase が primary source）。
 *
 * ■ 呼び出し方
 *   content/server.ts が教材を取得したあとに、同じリクエスト内で 1 回だけ呼ぶ。
 *   進捗テーブルを content 側から import すると循環するため、
 *   必要な情報（Supabase クライアント・ID 変換表・教材メタ）は引数で受け取る。
 *
 * ■ 件数
 *   1 ユーザーあたりレッスン 90 行・お気に入り数十行なので、
 *   ページごとに個別クエリを撃たず 1 回で全件取得する。
 *
 * ■ uuid を外に出さない
 *   DB から返る lesson_id / course_id は uuid だが、ここで slug へ写してから返す。
 *   ProgressSource は ContentProvider 経由でクライアントへ渡るため、
 *   uuid が混ざらないようにする。
 */

/** テーブル未作成（マイグレーション未適用）を表す PostgREST のコード */
const TABLE_MISSING = "PGRST205";

/**
 * 学習履歴として読み込む上限。
 * 学習履歴ページは「もっと見る」で段階的に増やす想定なので、
 * 初回から全件を取りにいかない。連続学習日数の算出にも十分な量。
 */
const HISTORY_LIMIT = 200;

let warnedMissing = false;

export type ProgressLoadResult = {
  progress: ProgressSource;
  /** Supabase から取得できたか（false なら進捗テーブルが未適用） */
  fromDatabase: boolean;
};

export async function loadProgressSource(input: {
  supabase: SupabaseClient<Database>;
  /** 未ログインなら null。その場合は空の進捗を返す */
  userId: string | null;
  maps: ContentIdMaps;
  lessons: LessonMeta[];
  courseIds: string[];
  now?: Date;
}): Promise<ProgressLoadResult> {
  const { supabase, userId, maps, lessons, courseIds } = input;
  const now = input.now ?? new Date();

  const empty = () =>
    buildProgressSource({
      lessons,
      courseIds,
      records: [],
      viewEvents: [],
      favoriteLessonIds: [],
      favoriteCourseIds: [],
      now,
    });

  // 未ログインでも教材ページ自体は組み立てられるようにしておく
  if (!userId) {
    return { progress: empty(), fromDatabase: false };
  }

  const [progressRes, eventRes, lessonFavRes, courseFavRes] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, status, position_seconds, completed_at, last_viewed_at")
      .eq("user_id", userId),
    supabase
      .from("lesson_view_events")
      .select("id, lesson_id, viewed_at")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from("lesson_favorites")
      .select("lesson_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("course_favorites")
      .select("course_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const results = [progressRes, eventRes, lessonFavRes, courseFavRes];

  if (results.some((r) => r.error?.code === TABLE_MISSING)) {
    // 進捗テーブルが未適用でも教材の表示は止めない。
    // ただし本番でここに入ることは無い想定なので、必ず気付けるよう警告する。
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn(
        "[progress] 学習進捗のテーブルが見つかりません。進捗はすべて未視聴として扱います。" +
          " supabase/migrations/20260821100000_create_progress_tables.sql を適用してください。",
      );
    }
    return { progress: empty(), fromDatabase: false };
  }

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    // 権限エラーなど、握りつぶすと原因が分からなくなる失敗はそのまま投げる
    throw new Error(
      `[progress] 学習進捗の取得に失敗しました: ${failed.error.message} (${failed.error.code})`,
    );
  }

  /* ---- uuid → slug へ写す。対応が無い行は捨てる ---------------------- */

  const records: ProgressRecord[] = [];
  for (const row of progressRes.data ?? []) {
    const lessonId = maps.lessonSlugByUuid.get(row.lesson_id);
    if (!lessonId) continue;
    records.push({
      lessonId,
      status: row.status,
      positionSeconds: row.position_seconds,
      completedAt: row.completed_at,
      lastViewedAt: row.last_viewed_at,
    });
  }

  const viewEvents: ViewEventRecord[] = [];
  for (const row of eventRes.data ?? []) {
    const lessonId = maps.lessonSlugByUuid.get(row.lesson_id);
    if (!lessonId) continue;
    viewEvents.push({ id: row.id, lessonId, viewedAt: row.viewed_at });
  }

  const favoriteLessonIds: string[] = [];
  for (const row of lessonFavRes.data ?? []) {
    const slug = maps.lessonSlugByUuid.get(row.lesson_id);
    if (slug) favoriteLessonIds.push(slug);
  }

  const favoriteCourseIds: string[] = [];
  for (const row of courseFavRes.data ?? []) {
    const slug = maps.courseSlugByUuid.get(row.course_id);
    if (slug) favoriteCourseIds.push(slug);
  }

  return {
    progress: buildProgressSource({
      lessons,
      courseIds,
      records,
      viewEvents,
      favoriteLessonIds,
      favoriteCourseIds,
      now,
    }),
    fromDatabase: true,
  };
}
