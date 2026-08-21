import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StudentStatusTag } from "@/components/admin/StudentStatusTag";
import { EnrollmentEditor } from "@/components/admin/EnrollmentEditor";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminStudent, getAdminStudents } from "@/lib/admin/server";
import { adminDate, progressLabel, studentStatus } from "@/lib/admin/format";

/**
 * 受講生詳細。
 *
 * 「動画が見られません」の問い合わせに対して、
 * **この 1 画面で原因が分かる**ことを最優先にしている。
 * 受講権限の付与・解除・期限の変更も、離れた画面へ飛ばさずここで完結させる。
 */
export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const [student, { courses }] = await Promise.all([
    getAdminStudent(userId),
    getAdminStudents(),
  ]);
  if (!student) notFound();

  const status = studentStatus(student);
  return (
    <>
      <div className="mb-4">
        <Link href="/admin/students" className="text-13 text-brand-deep hover:underline">
          ← 受講生一覧
        </Link>
      </div>

      <AdminPageHeader title={student.displayName} description={student.email} />

      <section className="mb-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-14 lg:grid-cols-4">
          <div>
            <dt className="text-125 text-ink4">状態</dt>
            <dd className="mt-1.5">
              <StudentStatusTag label={status.label} tone={status.tone} />
            </dd>
          </div>
          <div>
            <dt className="text-125 text-ink4">最終ログイン</dt>
            <dd className="mt-1.5 text-ink2 tabular-nums">{adminDate(student.lastSignInAt)}</dd>
          </div>
          <div>
            <dt className="text-125 text-ink4">最終学習</dt>
            <dd className="mt-1.5 text-ink2 tabular-nums">{adminDate(student.lastViewedAt)}</dd>
          </div>
          <div>
            <dt className="text-125 text-ink4">学習</dt>
            <dd className="mt-1.5 text-ink2 tabular-nums">
              {progressLabel(student.completedLessons, student.totalLessons)}
            </dd>
          </div>
        </dl>
      </section>

      <EnrollmentEditor
        userId={student.id}
        studentName={student.displayName}
        courses={courses}
        enrollments={student.enrollments}
      />

      <p className="mt-4 text-125 text-ink4">
        受講権限の変更は記録に残ります（誰が・いつ・何をしたか）。
      </p>
    </>
  );
}
