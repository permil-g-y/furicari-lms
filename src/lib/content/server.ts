import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { dummyProgress } from "@/lib/progress/dummy";
import { createContentApi, type ContentApi, type ContentSnapshot } from "./api";
import { buildLongDescriptions, buildSnapshot, type ContentRows } from "./snapshot";
import { buildMockSnapshot, mockLongDescriptions } from "./mock-fallback";

/**
 * 教材データの取得（Supabase が primary source）。
 *
 * 件数が小さい（コース 6 / チャプター 25 / レッスン 90）ので、
 * ページごとに個別クエリを撃たず 1 リクエストにつき 1 回だけ全件取得して
 * メモリ上で引き当てる。React の cache() で同一リクエスト内は 1 回に集約されるため
 * N+1 が起きない。
 */

export type ContentBundle = {
  api: ContentApi;
  snapshot: ContentSnapshot;
  longDescriptions: Record<string, string>;
  /** Supabase から取得できたか（false なら開発用フォールバック） */
  fromDatabase: boolean;
};

/** テーブル未作成（マイグレーション未適用）を表す PostgREST のコード */
const TABLE_MISSING = "PGRST205";

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
      longDescriptions: mockLongDescriptions,
      fromDatabase: false,
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

  const snapshot = buildSnapshot(rows, dummyProgress);

  return {
    api: createContentApi(snapshot, dummyProgress),
    snapshot,
    longDescriptions: buildLongDescriptions(rows.courses),
    fromDatabase: true,
  };
}

/** 同一リクエスト内では 1 回しか実行されない */
export const getContentBundle = cache(loadContent);

/** Server Component から教材データを引くときの入口 */
export async function getContent(): Promise<ContentApi> {
  return (await getContentBundle()).api;
}
