import { AppShell } from "@/components/layout/AppShell";
import { FavoritesProvider } from "@/lib/favorites-context";
import { requireUser } from "@/lib/auth/user";
import { getContentBundle } from "@/lib/content/server";
import { ContentProvider } from "@/lib/content/context";
import { getAnnouncements, getUnreadAnnouncementCount } from "@/lib/news/server";
import { AnnouncementProvider } from "@/lib/news/context";

/**
 * 認証が必要なゾーン。
 *
 * proxy.ts でも保護しているが、サーバー側でも requireUser() で検証することで
 * 「クライアント状態だけに依存しない」二重の保護にしている。
 *
 * 教材データはここで 1 回だけ Supabase から取得し、ContentProvider 経由で
 * 配下の Client Component へ配る（ページごとに個別クエリを撃たない）。
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, content, announcements, unreadNews] = await Promise.all([
    requireUser(),
    getContentBundle(),
    getAnnouncements(),
    getUnreadAnnouncementCount(),
  ]);

  return (
    <ContentProvider snapshot={content.snapshot} progress={content.progress}>
      <AnnouncementProvider announcements={announcements}>
        <FavoritesProvider
        initialLessonIds={content.progress.favoriteLessonIds}
        initialCourseIds={content.progress.favoriteCourseIds}
      >
        <AppShell
          user={{ displayName: user.displayName, avatarUrl: user.avatarUrl }}
          hasUnreadNews={unreadNews > 0}
        >
          {children}
        </AppShell>
        </FavoritesProvider>
      </AnnouncementProvider>
    </ContentProvider>
  );
}
