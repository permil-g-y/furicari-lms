import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminAnnouncements } from "@/lib/admin/announcement-server";
import { announcementState, STATE_LABELS } from "@/lib/admin/announcement-draft";
import { announcementCategoryLabel } from "@/lib/news/presentation";
import { adminDate } from "@/lib/admin/format";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const rows = await getAdminAnnouncements();
  const now = new Date();

  return (
    <>
      <AdminPageHeader
        title="お知らせ"
        description={`${rows.length} 件`}
        action={
          <Link
            href="/admin/announcements/new"
            className="inline-flex h-11 items-center rounded-full bg-brand px-5 font-rounded text-14 font-bold text-white transition-colors hover:bg-brand-hover"
          >
            新しいお知らせ
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface px-6 py-8 text-center text-14 text-ink3">
          お知らせがまだありません。
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul>
            {rows.map((row) => {
              const state = announcementState(row, now);
              return (
                <li key={row.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/admin/announcements/${row.slug}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-brand-tint/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-14 font-medium text-ink">
                        {row.title}
                      </span>
                      <span className="block truncate text-125 text-ink4">
                        {announcementCategoryLabel[row.category]} ・ 本文 {row.body.length} ブロック
                      </span>
                    </span>
                    <StateTag state={state} />
                    <span className="w-24 flex-none text-right text-13 text-ink2 tabular-nums">
                      {adminDate(row.publishedAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function StateTag({ state }: { state: "published" | "scheduled" | "draft" }) {
  const label = STATE_LABELS[state];
  if (state === "published") return <Tag tone="success">{label}</Tag>;
  if (state === "scheduled") return <Tag tone="brand">{label}</Tag>;
  return <Tag tone="muted">{label}</Tag>;
}
