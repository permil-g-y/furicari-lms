import { notFound, redirect } from "next/navigation";
import { WatchView } from "@/components/video/WatchView";
import { getContent, getContentBundle } from "@/lib/content/server";
import { canAccessCourse } from "@/lib/enrollment/access";
import { requireUser } from "@/lib/auth/user";
import { createPlaybackSource } from "@/lib/stream";

// レッスンは Supabase 由来になったため静的生成できない（generateStaticParams は廃止）。

export default async function WatchPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const content = await getContent();
  const lesson = content.getLesson(lessonId);
  if (!lesson) notFound();

  // 署名付き再生ソースは **サーバー側でのみ** 発行する。
  // requireUser() を通っている＝ログイン済みなので、未ログインへは決して渡らない。
  // 署名キーはここから先（クライアント）へは一切出ない。
  const user = await requireUser();

  /*
   * 受講権限の判定（Phase 6-E）。
   *
   * URL を直接叩かれても、受講していないコースの動画は再生させない。
   * 判定は **署名トークンを発行する前** に行うため、権限が無ければ
   * トークンは 1 度も生成されない。
   * 未受講のときは 404 ではなくコース詳細へ戻す
   * （カリキュラムは閲覧できる設計なので、そちらが自然な行き先）。
   */
  const { access } = await getContentBundle();
  if (!canAccessCourse(access, lesson.courseId)) {
    redirect(`/courses/${lesson.courseId}`);
  }

  const playback = await createPlaybackSource({
    streamVideoId: lesson.streamVideoId,
    userId: user.id,
  });

  return <WatchView lessonId={lessonId} playback={playback} />;
}
