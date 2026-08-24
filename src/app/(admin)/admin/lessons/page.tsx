import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { VideoStatusTag } from "@/components/admin/VideoStatusTag";
import { SyncAllButton } from "@/components/admin/SyncAllButton";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminLessons } from "@/lib/admin/lesson-server";
import { countVideoBuckets, videoBucket } from "@/lib/admin/lessons";
import { formatDuration } from "@/lib/content/format";

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  await requireAdmin();
  const { course } = await searchParams;
  const { lessons, unavailable } = await getAdminLessons();

  const courses = [...new Map(lessons.map((l) => [l.courseId, l.courseTitle])).entries()];
  const shown = course ? lessons.filter((l) => l.courseId === course) : lessons;
  const counts = countVideoBuckets(lessons);

  return (
    <>
      <AdminPageHeader
        title="レッスン"
        description={`全 ${counts.total} 本 ・ 動画未設定 ${counts.no_video} ・ 処理中 ${counts.processing} ・ エラー ${counts.failed} ・ 尺未取得 ${counts.unsynced}`}
        action={<SyncAllButton targetCount={counts.total - counts.no_video} />}
      />

      {unavailable && (
        <p className="mb-4 rounded-2xl border border-danger-line bg-pink-bg px-6 py-4 text-14 text-danger">
          {unavailable}
        </p>
      )}

      <nav className="mb-4 flex flex-wrap gap-2">
        <CourseChip href="/admin/lessons" label="すべて" on={!course} />
        {courses.map(([id, title]) => (
          <CourseChip
            key={id}
            href={`/admin/lessons?course=${id}`}
            label={title}
            on={course === id}
          />
        ))}
      </nav>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <ul>
          {shown.map((lesson) => (
            <li key={lesson.slug} className="border-b border-line last:border-b-0">
              <Link
                href={`/admin/lessons/${lesson.slug}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-brand-tint/40"
              >
                <span className="w-8 flex-none font-rounded text-13 text-ink4 tabular-nums">
                  {String(lesson.number).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-14 text-ink">{lesson.title}</span>
                  <span className="block truncate text-125 text-ink4">
                    {lesson.courseTitle} / {lesson.chapterTitle}
                  </span>
                </span>
                <VideoStatusTag bucket={videoBucket(lesson)} />
                <span className="w-14 flex-none text-right text-13 text-ink2 tabular-nums">
                  {lesson.streamSyncedAt ? formatDuration(lesson.durationSeconds) : "—"}
                </span>
                <span className="w-12 flex-none text-right text-125">
                  {lesson.isPublished ? (
                    <span className="text-ink2">公開</span>
                  ) : (
                    <span className="text-ink4">下書き</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function CourseChip({ href, label, on }: { href: string; label: string; on: boolean }) {
  return (
    <Link
      href={href}
      className={
        on
          ? "rounded-full bg-brand-tint px-4 py-2 font-rounded text-13 font-bold text-brand-deep"
          : "rounded-full border border-line bg-surface px-4 py-2 text-13 text-ink2 transition-colors hover:bg-brand-tint"
      }
    >
      {label}
    </Link>
  );
}
