import { notFound } from "next/navigation";
import { WatchView } from "@/components/video/WatchView";
import { allLessons, getLesson } from "@/lib/mock";

export function generateStaticParams() {
  return allLessons.map((lesson) => ({ lessonId: lesson.id }));
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) notFound();

  return <WatchView lessonId={lessonId} />;
}
