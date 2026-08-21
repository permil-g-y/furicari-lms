import { requireAdmin } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

/**
 * ダッシュボード。
 *
 * 7-A では枠だけ。数字と「要対応」は 7-H で埋める
 * （集計元になる受講生取得・Cloudflare 同期がまだ無いため）。
 */
export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <>
      <AdminPageHeader
        title="ダッシュボード"
        description="運営で「いま何をすべきか」をここに集約します。"
      />
      <p className="rounded-2xl border border-line bg-surface px-6 py-5 text-14 text-ink2">
        受講生数と「⚠ 要対応」の集計は、受講生取得（7-B）と
        Cloudflare 同期（7-F）が入ってから表示します。
      </p>
    </>
  );
}
