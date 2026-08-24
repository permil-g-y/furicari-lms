import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminStudents } from "@/lib/admin/server";
import { getAdminLessons } from "@/lib/admin/lesson-server";
import { countVideoBuckets } from "@/lib/admin/lessons";
import { isExpiringSoon } from "@/lib/admin/expiry";

/**
 * ダッシュボード。
 *
 * グラフは置かない。運営が「いま何をすべきか」だけを出す。
 * 「⚠ 要対応」が 0 件なら健全、という読み方ができる形にしている。
 *
 * 動画の件数は必ず分けて出す（REVIEW 04）。
 * 「動画をまだ入れていない」と「同期に失敗した」では次の行動が違うため。
 */
export default async function AdminDashboardPage() {
  await requireAdmin();

  const [{ rows }, { lessons }] = await Promise.all([
    getAdminStudents(),
    getAdminLessons(),
  ]);

  const counts = countVideoBuckets(lessons);
  const now = new Date();
  const enrolled = rows.filter((row) => row.enrollment === "enrolled");
  const attention = rows.filter((row) => row.needsAttention);
  const expiringSoon = rows.filter((row) =>
    row.enrollments.some((e) => isExpiringSoon(e.expiresAt, now)),
  );
  const drafts = lessons.filter((lesson) => !lesson.isPublished);

  const todo = [
    { label: "受講権限が無い受講生", count: attention.length, href: "/admin/students" },
    { label: "7 日以内に期限切れ", count: expiringSoon.length, href: "/admin/students" },
    { label: "動画の処理に失敗", count: counts.failed, href: "/admin/lessons" },
    { label: "動画を処理中", count: counts.processing, href: "/admin/lessons" },
    { label: "実尺が未取得の動画", count: counts.unsynced, href: "/admin/lessons" },
    { label: "下書きのレッスン", count: drafts.length, href: "/admin/lessons" },
  ].filter((item) => item.count > 0);

  return (
    <>
      <AdminPageHeader title="ダッシュボード" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="受講生" value={rows.length} unit="名" />
        <Stat label="受講中" value={enrolled.length} unit="名" />
        <Stat label="動画あり" value={counts.total - counts.no_video} unit={`/ ${counts.total} 本`} />
        <Stat label="公開中のレッスン" value={counts.total - drafts.length} unit="本" />
      </div>

      <section className="rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-6 py-4 font-rounded text-16 font-bold text-ink">
          要対応
        </h2>
        {todo.length === 0 ? (
          <p className="px-6 py-5 text-14 text-ink2">
            いま対応が必要な項目はありません。
          </p>
        ) : (
          <ul>
            {todo.map((item) => (
              <li key={item.label} className="border-b border-line last:border-b-0">
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-brand-tint/40"
                >
                  <span className="flex-1 text-14 text-ink2">{item.label}</span>
                  <span className="font-rounded text-16 font-bold text-ink tabular-nums">
                    {item.count}
                  </span>
                  <span className="text-13 text-brand-deep">確認する →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-125 text-ink4">
        「動画未設定 {counts.no_video} 本」は、まだ動画を入れていないレッスンです（同期の失敗ではありません）。
      </p>
    </>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-125 text-ink4">{label}</p>
      <p className="mt-1 font-rounded text-ink">
        <span className="text-22 font-bold tabular-nums">{value}</span>
        <span className="ml-1 text-125 text-ink3">{unit}</span>
      </p>
    </div>
  );
}
