"use client";

import { createContext, useContext, useMemo } from "react";
import type { ProgressSource } from "@/lib/progress/types";
import { createContentApi, type ContentApi, type ContentSnapshot } from "./api";

/**
 * 教材データと学習進捗を Client Component へ渡すための Context。
 *
 * Supabase からの取得は Server Component（(main)/layout.tsx）で 1 回だけ行い、
 * その結果のスナップショットをここへ流し込む。
 * Client 側からは同期的なセレクタとして使えるので、
 * Phase 1 のコンポーネント構造・デザインを変えずに DB 化できる。
 *
 * progress をここで import せず props で受け取るのが重要で、
 * これによりクライアントバンドルがダミーデータへ依存しなくなる。
 */
const ContentContext = createContext<ContentApi | null>(null);

export function ContentProvider({
  snapshot,
  progress,
  children,
}: {
  snapshot: ContentSnapshot;
  progress: ProgressSource;
  children: React.ReactNode;
}) {
  const api = useMemo(
    () => createContentApi(snapshot, progress),
    [snapshot, progress],
  );
  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentApi {
  const api = useContext(ContentContext);
  if (!api) {
    throw new Error("useContent は ContentProvider の内側で使用してください");
  }
  return api;
}
