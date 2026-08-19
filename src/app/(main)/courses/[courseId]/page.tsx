import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/course/CourseDetail";
import { getContentBundle } from "@/lib/content/server";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { api, longDescriptions } = await getContentBundle();
  const course = api.getCourse(courseId);

  if (!course) notFound();

  return (
    <CourseDetail course={course} longDescription={longDescriptions[course.id]} />
  );
}
