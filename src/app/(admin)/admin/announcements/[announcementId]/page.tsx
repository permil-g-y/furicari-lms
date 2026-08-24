import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminAnnouncement } from "@/lib/admin/announcement-server";
import { announcementState, STATE_LABELS } from "@/lib/admin/announcement-draft";
import { adminDate } from "@/lib/admin/format";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  await requireAdmin();
  const { announcementId } = await params;
  const announcement = await getAdminAnnouncement(announcementId);
  if (!announcement) notFound();

  const state = announcementState(announcement);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/announcements" className="text-13 text-brand-deep hover:underline">
          ← お知らせ一覧
        </Link>
        {state === "published" && (
          <Link
            href={`/news/${announcement.slug}`}
            className="text-13 text-ink3 hover:underline"
          >
            受講生の画面で見る →
          </Link>
        )}
      </div>

      <AdminPageHeader
        title={announcement.title}
        description={`${STATE_LABELS[state]} ・ 公開日時 ${adminDate(announcement.publishedAt)}`}
      />

      <AnnouncementEditor announcement={announcement} />
    </>
  );
}
