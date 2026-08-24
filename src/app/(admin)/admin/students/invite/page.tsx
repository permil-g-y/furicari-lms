import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InviteForm } from "@/components/admin/InviteForm";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminStudents } from "@/lib/admin/server";

export default async function AdminInvitePage() {
  await requireAdmin();
  const { courses } = await getAdminStudents();

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/students" className="text-13 text-brand-deep hover:underline">
          ← 受講生一覧
        </Link>
      </div>
      <AdminPageHeader
        title="受講生を招待"
        description="招待メールを送り、同時に受講コースと期限を設定します。"
      />
      <InviteForm courses={courses} />
    </>
  );
}
