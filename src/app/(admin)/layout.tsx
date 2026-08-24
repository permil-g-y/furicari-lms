import Link from "next/link";
import { Logo } from "@/components/ui/Icon";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/admin";

/**
 * 管理画面ゾーン。
 *
 * 受講生向けの (main) とは別の Route Group にしてある。
 * ヘッダー・タブバー・ContentProvider・お知らせの未読取得などを
 * 引きずらないため（管理画面には不要で、片方の変更が他方を壊す原因になる）。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-[64px] max-w-[1240px] items-center gap-4 px-5 lg:px-10">
          <Link href="/admin" className="block leading-none">
            <Logo height={28} />
          </Link>
          <span className="rounded-full bg-brand-tint px-3 py-1 font-rounded text-11 font-bold text-brand-deep">
            管理
          </span>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-13 text-ink3 sm:inline">
              {admin.displayName}
            </span>
            <Link
              href="/"
              className="rounded-full border border-line bg-surface px-4 py-2 text-13 font-medium text-ink2 transition-colors hover:bg-brand-tint hover:text-brand-deep"
            >
              受講生画面へ
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-5 py-6 lg:flex-row lg:gap-10 lg:px-10 lg:py-10">
        <aside className="lg:w-[200px] lg:flex-none">
          <AdminNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
