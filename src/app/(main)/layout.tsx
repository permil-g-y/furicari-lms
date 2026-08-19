import { AppShell } from "@/components/layout/AppShell";
import { FavoritesProvider } from "@/lib/favorites-context";
import { requireUser } from "@/lib/auth/user";

/**
 * 認証が必要なゾーン。
 *
 * proxy.ts でも保護しているが、サーバー側でも requireUser() で検証することで
 * 「クライアント状態だけに依存しない」二重の保護にしている。
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <FavoritesProvider>
      <AppShell
        user={{ displayName: user.displayName, avatarUrl: user.avatarUrl }}
      >
        {children}
      </AppShell>
    </FavoritesProvider>
  );
}
