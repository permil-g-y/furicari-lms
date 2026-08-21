import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getProfile } from "@/lib/auth/user";
import { loadEnrollmentAccess } from "@/lib/enrollment/server";
import type { EnrollmentAccess } from "@/lib/enrollment/access";
import { dummyProgress } from "@/lib/progress/dummy";
import { loadProgressSource } from "@/lib/progress/server";
import type { ProgressSource } from "@/lib/progress/types";
import { createContentApi, type ContentApi, type ContentSnapshot } from "./api";
import {
  buildIdMaps,
  buildLongDescriptions,
  buildProgressInputs,
  buildSnapshot,
  type ContentIdMaps,
  type ContentRows,
} from "./snapshot";
import { buildMockSnapshot, mockLongDescriptions } from "./mock-fallback";

/**
 * 教材データと学習進捗の取得（Supabase が primary source）。
 *
 * 件数が小さい（コース 6 / チャプター 25 / レッスン 90）ので、
 * ページごとに個別クエリを撃たず 1 リクエストにつき 1 回だけ全件取得して
 * メモリ上で引き当てる。React の cache() で同一リクエスト内は 1 回に集約されるため
 * N+1 が起きない。学習進捗も同じリクエスト内で 1 回だけ取得する。
 */

export type ContentBundle = {
  api: ContentApi;
  snapshot: ContentSnapshot;
  /** 学習進捗。ContentProvider 経由でクライアントへも渡す（中身は slug のみ） */
  progress: ProgressSource;
  /**
   * slug と uuid の対応表。**サーバー専用**。
   * 進捗の書き込み（Server Action / Route Handler）で uuid が必要になる。
   * クライアントへ渡してはいけない。
   */
  ids: ContentIdMaps;
  longDescriptions: Record<string, string>;
  /** 教材を Supabase から取得できたか（false なら開発用フォールバック） */
  fromDatabase: boolean;
  /** 学習進捗を Supabase から取得できたか */
  progressFromDatabase: boolean;
  /**
   * 受講権限。**サーバー専用**。
   * watch ページが署名トークンを発行する前の判定に使う。
   */
  access: EnrollmentAccess;
};

/** テーブル未作成（マイグレーション未適用）を表す PostgREST のコード */
const TABLE_MISSING = "PGRST205";

const emptyIdMaps = (): ContentIdMaps => ({
  lessonUuidBySlug: new Map(),
  lessonSlugByUuid: new Map(),
  courseUuidBySlug: new Map(),
  courseSlugByUuid: new Map(),
});

let warnedFallback = false;

async function loadContent(): Promise<ContentBundle> {
  const supabase = await createClient();

  const [categories, tools, courses, chapters, lessons] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("tools").select("*").order("sort_order"),
    supabase.from("courses").select("*").order("sort_order"),
    supabase.from("chapters").select("*").order("sort_order"),
    supabase.from("lessons").select("*").order("sort_order"),
  ]);

  const results = [categories, tools, courses, chapters, lessons];
  const failed = results.find((r) => r.error);

  const tablesMissing = results.some((r) => r.error?.code === TABLE_MISSING);
  const noContent = !failed && (courses.data?.length ?? 0) === 0;

  if (tablesMissing || noContent) {
    // マイグレーション / シードが未適用でも開発を止めないためのフォールバック。
    // 本番ではここに入らない想定なので、必ず警告を出して気付けるようにする。
    // この経路では進捗もダミーのまま（Claude Design の見た目を再現する）。
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn(
        "[content] Supabase に教材データが見つからないため、開発用のフォールバック（src/lib/mock）を使用します。" +
          " supabase/migrations と supabase/seed を適用してください。",
      );
    }
    const snapshot = buildMockSnapshot(dummyProgress);
    return {
      api: createContentApi(snapshot, dummyProgress),
      snapshot,
      progress: dummyProgress,
      ids: emptyIdMaps(),
      longDescriptions: mockLongDescriptions,
      fromDatabase: false,
      progressFromDatabase: false,
      access: { enrolledCourseIds: new Set(), isAdmin: true },
    };
  }

  if (failed?.error) {
    // 権限エラーなど、フォールバックで隠すべきでない失敗はそのまま投げる
    throw new Error(
      `[content] 教材データの取得に失敗しました: ${failed.error.message} (${failed.error.code})`,
    );
  }

  const rows: ContentRows = {
    categories: categories.data ?? [],
    tools: tools.data ?? [],
    courses: courses.data ?? [],
    chapters: chapters.data ?? [],
    lessons: lessons.data ?? [],
  };

  const ids = buildIdMaps(rows);
  const progressInputs = buildProgressInputs(rows);
  const authUser = await getAuthUser();

  // 受講権限（Phase 6）。admin は全コース閲覧可
  const profile = authUser ? await getProfile(authUser.id) : null;
  const access = await loadEnrollmentAccess({
    supabase,
    userId: authUser?.id ?? null,
    isAdmin: profile?.role === "admin",
    maps: ids,
  });

  const { progress, fromDatabase: progressFromDatabase } = await loadProgressSource({
    supabase,
    userId: authUser?.id ?? null,
    maps: ids,
    lessons: progressInputs.lessons,
    courseIds: progressInputs.courseIds,
  });

  // Course 型の completedLessons / status / nextLessonId は進捗由来なので、
  // スナップショットの組み立ては進捗の集計より後に行う。
  const snapshot = buildSnapshot(rows, progress, access);

  return {
    api: createContentApi(snapshot, progress),
    snapshot,
    progress,
    ids,
    longDescriptions: buildLongDescriptions(rows.courses),
    fromDatabase: true,
    progressFromDatabase,
    access,
  };
}

/** 同一リクエスト内では 1 回しか実行されない */
export const getContentBundle = cache(loadContent);

/** Server Component から教材データを引くときの入口 */
export async function getContent(): Promise<ContentApi> {
  return (await getContentBundle()).api;
}
