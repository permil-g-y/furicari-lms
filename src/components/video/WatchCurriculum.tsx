"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  formatDuration,
  formatLessonNumber,
  getChaptersByCourse,
  getCoursePercent,
  getLessonStatus,
  getLessonsByChapter,
} from "@/lib/mock";
import type { Course, Lesson } from "@/lib/types";

type ChapterBlock = {
  id: string;
  title: string;
  badge: string;
  badgeTone: "done" | "current" | "rest";
  lessons: Lesson[];
};

function buildChapters(courseId: string, currentLessonId: string): ChapterBlock[] {
  return getChaptersByCourse(courseId).map((chapter) => {
    const lessons = getLessonsByChapter(chapter.id);
    const completedCount = lessons.filter(
      (l) => getLessonStatus(l.id) === "completed",
    ).length;
    const allDone = lessons.length > 0 && completedCount === lessons.length;
    const hasCurrent = lessons.some((l) => l.id === currentLessonId);
    return {
      id: chapter.id,
      title: `Chapter ${chapter.number}　${chapter.title}`,
      badge: allDone
        ? "✓ 完了"
        : hasCurrent
          ? "学習中"
          : `${completedCount}/${lessons.length}`,
      badgeTone: allDone ? "done" : hasCurrent ? "current" : "rest",
      lessons,
    };
  });
}

const pcBadgeClass: Record<ChapterBlock["badgeTone"], string> = {
  done: "bg-success-bg text-success",
  current: "bg-brand text-white",
  rest: "bg-page text-ink4",
};

/** 進捗ヘッダ（PC の aside 上部 / Mobile のカリキュラムタブ先頭で共通） */
function ProgressSummary({ course }: { course: Course }) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="text-12 text-ink4">
          {course.totalLessons}本中 {course.completedLessons}本 学習済み
        </span>
        <span className="font-rounded text-15 font-bold text-brand-deep">
          {getCoursePercent(course)}%
        </span>
      </div>
      <ProgressBar percent={getCoursePercent(course)} height={8} variant="brand" trackColor="#E6EEFA" />
    </>
  );
}

/**
 * 動画閲覧 PC 版の右カラム（このコースのカリキュラム）。
 * sticky + 内部スクロール。
 */
export function CurriculumPanel({
  course,
  currentLessonId,
}: {
  course: Course;
  currentLessonId: string;
}) {
  const chapters = buildChapters(course.id, currentLessonId);

  return (
    <aside className="sticky top-[100px] flex max-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-3.5 border-b border-surface-alt px-[22px] pb-[18px] pt-[22px]">
        <div className="flex items-center gap-[9px]">
          <Icon name="icon-book" size={20} />
          <span className="font-rounded text-155 font-bold text-ink">
            このコースのカリキュラム
          </span>
        </div>
        <div className="flex flex-col gap-[7px]">
          <ProgressSummary course={course} />
        </div>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto px-3 pb-4 pt-2.5">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 px-2.5 pb-2 pt-3.5">
              <span className="font-rounded text-13 font-bold text-ink-sub">
                {chapter.title}
              </span>
              <span
                className={`ml-auto flex h-[22px] shrink-0 items-center rounded-full px-[9px] text-105 font-bold ${pcBadgeClass[chapter.badgeTone]}`}
              >
                {chapter.badge}
              </span>
            </div>

            {chapter.lessons.map((lesson) => {
              const current = lesson.id === currentLessonId;
              const done = getLessonStatus(lesson.id) === "completed";
              return (
                <Link
                  key={lesson.id}
                  href={`/watch/${lesson.id}`}
                  className={`flex items-center gap-2.5 rounded-12 border px-2.5 py-[11px] ${
                    current
                      ? "border-brand-tint2 bg-brand-tint"
                      : "border-transparent hover:bg-surface-subtle"
                  }`}
                >
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-105 font-bold leading-none ${
                      current
                        ? "bg-brand pl-px text-white"
                        : done
                          ? "bg-success-bg text-success"
                          : "border border-[#EEF3FA] bg-page text-line-strong2"
                    }`}
                  >
                    {done ? "✓" : current ? "▶" : ""}
                  </span>
                  <span
                    className={`shrink-0 font-rounded text-115 font-bold ${
                      current ? "text-brand-deep" : "text-ink4"
                    }`}
                  >
                    {formatLessonNumber(lesson.number)}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-13 leading-[1.5] ${
                      current
                        ? "font-bold text-ink"
                        : done
                          ? "text-ink3"
                          : "text-ink-sub"
                    }`}
                  >
                    {lesson.title}
                  </span>
                  <span className="shrink-0 text-115 text-ink4">
                    {formatDuration(lesson.durationSeconds)}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}

const mobileBadgeClass: Record<ChapterBlock["badgeTone"], string> = {
  done: "bg-success-bg text-success",
  current: "bg-brand text-white",
  rest: "bg-[#EEF3FA] text-ink4",
};

/**
 * 動画閲覧 Mobile 版「カリキュラム」タブの中身。
 */
export function MobileCurriculum({
  course,
  currentLessonId,
}: {
  course: Course;
  currentLessonId: string;
}) {
  const chapters = buildChapters(course.id, currentLessonId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-18 border border-brand-tint4 bg-surface px-4 py-3.5 shadow-card">
        <ProgressSummary course={course} />
      </div>

      {chapters.map((chapter) => (
        <div key={chapter.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-rounded text-13 font-bold text-ink-sub">
              {chapter.title}
            </span>
            <span
              className={`flex h-5 shrink-0 items-center rounded-full px-2 text-10 font-bold ${mobileBadgeClass[chapter.badgeTone]}`}
            >
              {chapter.badge}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 rounded-18 border border-line bg-surface p-1.5 shadow-card">
            {chapter.lessons.map((lesson) => {
              const current = lesson.id === currentLessonId;
              const done = getLessonStatus(lesson.id) === "completed";
              return (
                <Link
                  key={lesson.id}
                  href={`/watch/${lesson.id}`}
                  className={`flex items-center gap-2.5 rounded-14 border px-2.5 py-3 ${
                    current ? "border-brand-tint2 bg-brand-tint" : "border-transparent"
                  }`}
                >
                  <span
                    className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-105 font-bold leading-none ${
                      current
                        ? "bg-brand pl-px text-white"
                        : done
                          ? "bg-success-bg text-success"
                          : "bg-page pl-px text-line-strong2"
                    }`}
                  >
                    {done ? "✓" : "▶"}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-13 leading-[1.5] ${
                      current
                        ? "font-bold text-ink"
                        : done
                          ? "text-ink3"
                          : "text-ink-sub"
                    }`}
                  >
                    {formatLessonNumber(lesson.number)}　{lesson.title}
                  </span>
                  <span className="shrink-0 text-11 text-ink4">
                    {formatDuration(lesson.durationSeconds)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
