import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StudentStatusTag } from "@/components/admin/StudentStatusTag";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminStudent, getAdminStudents } from "@/lib/admin/server";
import { adminDate, expiryLabel, progressLabel, studentStatus } from "@/lib/admin/format";

/**
 * 受講生詳細。
 *
 * 「動画が見られません」の問い合わせに対して、
 * **この 1 画面で原因が分かる**ことを最優先にしている。
 * 権限の変更（付与・解除・期限）は 7-C で同じ画面に足す。
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
  const enrolledIds = new Set(student.enrollments.map((e) => e.courseId));
  const notEnrolled = courses.filter((course) => !enrolledIds.has(course.id));

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

      <section className="rounded-2xl border border-line bg-surface">
        <h2 className="border-b border-line px-6 py-4 font-rounded text-16 font-bold text-ink">
          受講コース
        </h2>

        {student.enrollments.length === 0 ? (
          <p className="px-6 py-5 text-14 text-ink3">
            受講権限がありません。この状態では動画を再生できません。
          </p>
        ) : (
          <ul>
            {student.enrollments.map((enrollment) => (
              <li
                key={enrollment.courseId}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-6 py-4 last:border-b-0"
              >
                <span className="min-w-0 flex-1 text-14 text-ink">
                  {enrollment.courseTitle}
                </span>
                <span className="text-13 text-ink2 tabular-nums">
                  {expiryLabel(enrollment.expiresAt)}
                </span>
                {enrollment.active ? (
                  <StudentStatusTag label="有効" tone="ok" />
                ) : (
                  <StudentStatusTag label="期限切れ" tone="warn" />
                )}
              </li>
            ))}
          </ul>
        )}

        {notEnrolled.length > 0 && (
          <div className="border-t border-line px-6 py-4">
            <p className="text-125 text-ink4">未受講のコース</p>
            <p className="mt-1.5 text-13 text-ink2">
              {notEnrolled.map((course) => course.title).join(" / ")}
            </p>
          </div>
        )}
      </section>

      <p className="mt-4 text-125 text-ink4">
        受講権限の付与・解除・期限の変更は 7-C で、この画面から行えるようにします。
      </p>
    </>
  );
}
