import { notFound } from "next/navigation";
import { WatchView } from "@/components/video/WatchView";
import { getContent } from "@/lib/content/server";

// レッスンは Supabase 由来になったため静的生成できない（generateStaticParams は廃止）。

export default async function WatchPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const content = await getContent();
  if (!content.getLesson(lessonId)) notFound();

  return <WatchView lessonId={lessonId} />;
}
