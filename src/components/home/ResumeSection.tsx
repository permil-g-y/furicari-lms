import Link from "next/link";
import { LessonLink } from "@/components/video/LessonLink";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/ProgressBar";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { getContent } from "@/lib/content/server";
import { remainingLabel, watchedLabel } from "./util";

/**
 * 続きから学ぶ。
 * PC は 3 カラムのカード（サムネ下端に進捗、下部に視聴位置）。
 * Mobile は 124px サムネの横長リストカードを縦積み。
 */
export async function ResumeSection() {
  const content = await getContent();
  const lessons = content.getLessons(content.resumeLessonIds);

  /*
   * 視聴途中の動画が 1 本も無いとき（学習を始めたばかりのユーザー）は
   * セクションごと出さない。見出しだけが残って中身が空になるのを避けるため。
   * お気に入り・学習履歴には元から空状態のメッセージがあるが、
   * このセクションには Claude Design 上その用意が無い。
   */
  if (lessons.length === 0) return null;

  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-2 px-4">
          <Icon name="icon-film" size={20} />
          <h2 className="font-rounded text-16 font-bold text-ink">続きから学ぶ</h2>
          <Link href="/videos" className="ml-auto text-125 font-medium text-brand-deep">
            すべて 〉
          </Link>
        </div>

        <div className="flex flex-col gap-2.5 px-4">
          {lessons.map((lesson) => {
            const course = content.getCourse(lesson.courseId);
            return (
              <LessonLink
                key={lesson.id}
                lessonId={lesson.id}
                className="flex items-center gap-3 rounded-18 border border-line bg-surface p-3 shadow-card"
              >
                <VideoThumbnail
                  tool={lesson.tool}
                  status={content.getLessonStatus(lesson.id)}
                  percent={content.getLessonPercent(lesson.id)}
                  scale="sm"
                  showDuration={false}
                  className="shrink-0 overflow-hidden rounded-12"
                  style={{ width: 124 }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <span className="text-14 font-bold leading-[1.5] text-ink">
                    {lesson.title}
                  </span>
                  <span className="truncate text-115 text-ink4">
                    {course?.title} ・ {remainingLabel(content, lesson.id)}
                  </span>
                </div>
              </LessonLink>
            );
          })}
        </div>
      </section>

      {/* ---- PC ---- */}
      <section className="hidden flex-col gap-5 lg:flex">
        <SectionHeading
          icon="icon-film"
          title="続きから学ぶ"
          note="視聴途中の動画"
          action={{ label: "すべて見る", href: "/videos" }}
        />

        <div className="grid grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const course = content.getCourse(lesson.courseId);
            const chapter = content.getChapter(lesson.chapterId);
            return (
              <LessonLink
                key={lesson.id}
                lessonId={lesson.id}
                className="block overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all hover:border-brand-tint3 hover:shadow-card-hover"
              >
                <VideoThumbnail
                  tool={lesson.tool}
                  durationSeconds={lesson.durationSeconds}
                  status={content.getLessonStatus(lesson.id)}
                  percent={content.getLessonPercent(lesson.id)}
                  scale="md"
                />
                <div className="flex flex-col gap-2.5 px-[18px] pb-5 pt-[18px]">
                  <h3 className="text-155 font-bold leading-[1.55] text-ink">{lesson.title}</h3>
                  <span className="text-125 text-ink3">
                    {course?.title}
                    {chapter && ` ・ Chapter ${chapter.number}`}
                  </span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-12 text-ink4">{watchedLabel(content, lesson.id)}</span>
                    <span className="text-125 font-bold text-brand-deep">続きから見る 〉</span>
                  </div>
                </div>
              </LessonLink>
            );
          })}
        </div>
      </section>
    </>
  );
}
