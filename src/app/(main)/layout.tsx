import { AppShell } from "@/components/layout/AppShell";
import { FavoritesProvider } from "@/lib/favorites-context";

/** 認証が必要なゾーン（Phase 2 で middleware による保護を追加する） */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <AppShell>{children}</AppShell>
    </FavoritesProvider>
  );
}
