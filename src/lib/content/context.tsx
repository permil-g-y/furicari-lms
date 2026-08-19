"use client";

import { createContext, useContext, useMemo } from "react";
import { dummyProgress } from "@/lib/progress/dummy";
import { createContentApi, type ContentApi, type ContentSnapshot } from "./api";

/**
 * 教材データを Client Component へ渡すための Context。
 *
 * Supabase からの取得は Server Component（(main)/layout.tsx）で 1 回だけ行い、
 * その結果のスナップショットをここへ流し込む。
 * Client 側からは同期的なセレクタとして使えるので、
 * Phase 1 のコンポーネント構造・デザインを変えずに DB 化できる。
 */
const ContentContext = createContext<ContentApi | null>(null);

export function ContentProvider({
  snapshot,
  children,
}: {
  snapshot: ContentSnapshot;
  children: React.ReactNode;
}) {
  const api = useMemo(() => createContentApi(snapshot, dummyProgress), [snapshot]);
  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentApi {
  const api = useContext(ContentContext);
  if (!api) {
    throw new Error("useContent は ContentProvider の内側で使用してください");
  }
  return api;
}
