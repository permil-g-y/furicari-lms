import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewAnnouncementPage() {
  await requireAdmin();
  return (
    <>
      <div className="mb-4">
        <Link href="/admin/announcements" className="text-13 text-brand-deep hover:underline">
          ← お知らせ一覧
        </Link>
      </div>
      <AdminPageHeader
        title="新しいお知らせ"
        description="公開日時を未来にすると予約公開になります。"
      />
      <AnnouncementEditor announcement={null} />
    </>
  );
}
