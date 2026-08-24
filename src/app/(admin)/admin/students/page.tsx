import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { StudentTable } from "@/components/admin/StudentTable";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminStudents } from "@/lib/admin/server";
import { filterStudents } from "@/lib/admin/students";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const { rows, unavailable } = await getAdminStudents();
  const filtered = filterStudents(rows, q);
  const attention = rows.filter((row) => row.needsAttention).length;

  return (
    <>
      <AdminPageHeader
        title="受講生"
        description={
          unavailable
            ? undefined
            : `${rows.length} 名${attention > 0 ? ` ・ 要対応 ${attention} 名` : ""}`
        }
        action={
          <Link
            href="/admin/students/invite"
            className="inline-flex h-11 items-center rounded-full bg-brand px-5 font-rounded text-14 font-bold text-white transition-colors hover:bg-brand-hover"
          >
            受講生を招待
          </Link>
        }
      />

      {unavailable ? (
        <p className="rounded-2xl border border-danger-line bg-pink-bg px-6 py-5 text-14 text-danger">
          {unavailable}
        </p>
      ) : (
        <>
          <div className="mb-4">
            <Suspense fallback={null}>
              <AdminSearchForm placeholder="名前・メールアドレスで検索" />
            </Suspense>
          </div>
          <StudentTable rows={filtered} />
        </>
      )}
    </>
  );
}
