import { notFound } from "next/navigation";
import { WatchView } from "@/components/video/WatchView";
import { getContent } from "@/lib/content/server";
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
  const playback = await createPlaybackSource({
    streamVideoId: lesson.streamVideoId,
    userId: user.id,
  });

  return <WatchView lessonId={lessonId} playback={playback} />;
}
