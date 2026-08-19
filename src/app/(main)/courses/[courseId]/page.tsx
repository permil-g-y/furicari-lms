import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/course/CourseDetail";
import { courses, getCourse } from "@/lib/mock";

export function generateStaticParams() {
  return courses.map((course) => ({ courseId: course.id }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);

  if (!course) notFound();

  return <CourseDetail course={course} />;
}
