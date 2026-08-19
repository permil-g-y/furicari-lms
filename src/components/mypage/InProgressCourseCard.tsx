import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CourseStatusBadge, Tag } from "@/components/ui/Tag";
import {
  formatLessonNumber,
  getChapter,
  getCoursePercent,
  getLesson,
  getResumeLessonId,
} from "@/lib/mock";
import type { Course } from "@/lib/types";

/**
 * マイページ「現在学習中のコース」のカード。
 * Claude Design では 1 枚目だけ枠 #BFDCFA + 濃い影 + 塗りボタンで強調されている。
 */
export function InProgressCourseCard({
  course,
  highlight = false,
}: {
  course: Course;
  highlight?: boolean;
}) {
  const percent = getCoursePercent(course);
  const nextLessonId = getResumeLessonId(course);
  const lesson = getLesson(nextLessonId);
  const chapter = lesson ? getChapter(lesson.chapterId) : undefined;

  return (
    <article
      className={`flex flex-col gap-4 rounded-card bg-surface p-4 lg:gap-[18px] lg:p-[26px] ${
        highlight
          ? "border border-brand-tint2 shadow-soft"
          : "border border-line shadow-card"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <CourseStatusBadge status={course.status} height={26} />
        <Tag tone="default" height={26} paddingX={11} className="border border-line">
          全{course.totalLessons}本
        </Tag>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-rounded text-16 font-bold text-ink lg:text-18">
          {course.title}
        </h3>
        {chapter && (
          <span className="text-125 text-ink3">
            Chapter {chapter.number}　{chapter.title}
          </span>
        )}
        {lesson && (
          <span className="text-125 text-ink2 lg:text-13">
            次に見る：{formatLessonNumber(lesson.number)}　{lesson.title}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <span className="text-115 text-ink4">
            {course.totalLessons}本中 {course.completedLessons}本 学習済み
          </span>
          <span className="font-rounded text-15 font-bold text-brand-deep">
            {percent}%
          </span>
        </div>
        <ProgressBar percent={percent} height={8} trackColor="#E6EEFA" />
      </div>

      {highlight ? (
        <Button href={`/watch/${nextLessonId}`} size={46} block>
          学習を続ける
        </Button>
      ) : (
        <Link
          href={`/watch/${nextLessonId}`}
          className="flex h-[46px] items-center justify-center rounded-full border border-brand-tint2 bg-surface text-14 font-bold text-brand-deep transition-colors hover:bg-brand-tint"
        >
          学習を続ける
        </Link>
      )}
    </article>
  );
}
