import { AppShell } from "@/components/layout/AppShell";
import { FavoritesProvider } from "@/lib/favorites-context";
import { requireUser } from "@/lib/auth/user";
import { getContentBundle } from "@/lib/content/server";
import { ContentProvider } from "@/lib/content/context";

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
  const [user, content] = await Promise.all([requireUser(), getContentBundle()]);

  return (
    <ContentProvider snapshot={content.snapshot}>
      <FavoritesProvider>
        <AppShell
          user={{ displayName: user.displayName, avatarUrl: user.avatarUrl }}
        >
          {children}
        </AppShell>
      </FavoritesProvider>
    </ContentProvider>
  );
}
