"use client";

import { createContext, useContext } from "react";
import type { Announcement } from "@/lib/types";

/**
 * お知らせを Client Component へ渡すための Context。
 *
 * 取得は Server Component（(main)/layout.tsx）で 1 回だけ行い、
 * その結果をここへ流し込む。教材（ContentProvider）と同じ形にしてあるので、
 * お知らせ一覧ページは import を差し替えるだけで実データ化できる。
 */
const AnnouncementContext = createContext<Announcement[] | null>(null);

export function AnnouncementProvider({
  announcements,
  children,
}: {
  announcements: Announcement[];
  children: React.ReactNode;
}) {
  return (
    <AnnouncementContext.Provider value={announcements}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements(): Announcement[] {
  const list = useContext(AnnouncementContext);
  if (!list) {
    throw new Error("useAnnouncements は AnnouncementProvider の内側で使用してください");
  }
  return list;
}
