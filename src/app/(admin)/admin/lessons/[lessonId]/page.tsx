import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminLesson } from "@/lib/admin/lesson-server";
import { formatDuration } from "@/lib/content/format";

export default async function AdminLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  await requireAdmin();
  const { lessonId } = await params;
  const lesson = await getAdminLesson(lessonId);
  if (!lesson) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/admin/lessons?course=${lesson.courseId}`}
          className="text-13 text-brand-deep hover:underline"
        >
          ← レッスン一覧
        </Link>
      </div>

      <AdminPageHeader
        title={`${String(lesson.number).padStart(2, "0")}　${lesson.title}`}
        description={`${lesson.courseTitle} / ${lesson.chapterTitle}`}
      />

      <section className="mb-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-14 lg:grid-cols-3">
          <div>
            <dt className="text-125 text-ink4">公開状態</dt>
            <dd className="mt-1.5 text-ink2">{lesson.isPublished ? "公開中" : "下書き"}</dd>
          </div>
          <div>
            <dt className="text-125 text-ink4">尺</dt>
            <dd className="mt-1.5 text-ink2 tabular-nums">
              {lesson.streamSyncedAt ? formatDuration(lesson.durationSeconds) : "未取得"}
            </dd>
          </div>
          <div>
            <dt className="text-125 text-ink4">動画 ID</dt>
            <dd className="mt-1.5 truncate text-125 text-ink3">
              {lesson.streamVideoId ?? "未設定"}
            </dd>
          </div>
        </dl>
      </section>

      <VideoUploader lesson={lesson} />
    </>
  );
}
