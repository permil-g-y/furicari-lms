import Link from "next/link";
import { Button, PlayTriangle } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import {
  formatLessonNumber,
  getChapter,
  getCoursePercent,
  getLesson,
  getLessonPercent,
  getPrimaryCourse,
  getResumeLessonId,
  levelLabel,
} from "@/lib/mock";
import { remainingLabel } from "./util";

/** アウトラインの CTA（Reference は #BFDCFA 枠 + #2C7BE0 文字。Button の outline とは初期配色が違う） */
const outlineCta = "border-brand-tint2! text-brand-deep!";

/**
 * 現在学習中のコース。TOP で最も強い CTA ブロック。
 * PC は「情報カラム + モックプレイヤー」の 2 カラム、Mobile は縦積みの 1 枚カード。
 */
export function CurrentCourseSection() {
  const course = getPrimaryCourse();
  const lessonId = getResumeLessonId(course);
  const lesson = getLesson(lessonId);
  const chapter = lesson ? getChapter(lesson.chapterId) : undefined;
  const percent = getCoursePercent(course);
  const lessonPercent = getLessonPercent(lessonId);
  const restLessons = course.totalLessons - course.completedLessons;
  const watchHref = `/watch/${lessonId}`;
  const courseHref = `/courses/${course.id}`;
  const chapterLine = chapter ? `Chapter ${chapter.number}　${chapter.title}` : "";
  const lessonTitle = lesson
    ? `${formatLessonNumber(lesson.number)}　${lesson.title}`
    : "";

  return (
    <>
      {/* ---- Mobile ---- */}
      <section className="flex flex-col gap-3 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Icon name="icon-video" size={20} />
          <h2 className="font-rounded text-16 font-bold text-ink">現在学習中のコース</h2>
        </div>

        <article
          className="flex flex-col gap-3.5 rounded-card border border-brand-tint4 p-4"
          style={{
            background: "linear-gradient(180deg,#EAF4FF 0%,#FFFFFF 70%)",
            boxShadow: "0 4px 16px rgba(59,144,245,.08)",
          }}
        >
          {lesson && (
            <Link href={watchHref} className="block overflow-hidden rounded-14">
              <VideoThumbnail
                tool={lesson.tool}
                status="in_progress"
                percent={lessonPercent}
                scale="md"
                showPlay={false}
                showDuration={false}
              >
                <span
                  className="flex items-center justify-center rounded-full shadow-overlay"
                  style={{ width: 52, height: 52, background: "rgba(255,255,255,.94)" }}
                >
                  <PlayTriangle size={15} color="#3B90F5" />
                </span>
                <span
                  className="absolute bottom-2.5 right-2.5 flex items-center rounded-6 text-115 text-white"
                  style={{ height: 22, paddingInline: 7, background: "rgba(16,29,51,.72)" }}
                >
                  {remainingLabel(lessonId)}
                </span>
              </VideoThumbnail>
            </Link>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Tag tone="solid" height={24} paddingX={10} fontSize={11}>
                学習中
              </Tag>
              <span className="min-w-0 truncate text-115 text-ink3">{chapterLine}</span>
            </div>
            <span className="text-16 font-bold leading-[1.5] text-ink">{lessonTitle}</span>
            <span className="text-12 text-ink4">{course.title}</span>
          </div>

          <div className="flex flex-col gap-[7px]">
            <div className="flex items-baseline justify-between">
              <span className="text-115 text-ink4">
                {course.totalLessons}本中 {course.completedLessons}本 学習済み
              </span>
              <span className="font-rounded text-15 font-bold text-brand-deep">{percent}%</span>
            </div>
            <ProgressBar percent={percent} height={8} variant="brand" trackColor="#DCEAFB" />
          </div>

          <div className="flex flex-col gap-2">
            <Button href={watchHref} size={52} block className="text-16!">
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: "rgba(255,255,255,.22)" }}
              >
                <PlayTriangle size={8} color="#fff" />
              </span>
              学習を続ける
            </Button>
            <Button
              href={courseHref}
              variant="outline"
              size={46}
              block
              className={outlineCta}
            >
              コースの目次を見る
            </Button>
          </div>
        </article>
      </section>

      {/* ---- PC ---- */}
      <section className="hidden flex-col gap-5 lg:flex">
        <div className="flex items-center gap-2.5">
          <Icon name="icon-video" size={24} />
          <h2 className="font-rounded text-20 font-bold text-ink">現在学習中のコース</h2>
        </div>

        <div
          className="grid grid-cols-[1fr_340px] items-center gap-10 rounded-panel border border-brand-tint4 p-8 shadow-soft"
          style={{ background: "linear-gradient(180deg,#EAF4FF 0%,#FBFDFF 62%)" }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <Tag tone="solid" height={28} paddingX={12} fontSize={12}>
                学習中
              </Tag>
              <Tag
                tone="white"
                height={28}
                paddingX={12}
                fontSize={12}
                className="font-medium text-ink2!"
              >
                {levelLabel(course.level)}
              </Tag>
              <Tag
                tone="white"
                height={28}
                paddingX={12}
                fontSize={12}
                className="font-medium text-ink2!"
              >
                全{course.totalLessons}本 / {course.durationLabel}
              </Tag>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-rounded text-26 font-bold leading-[1.4] text-ink">
                {course.title}
              </h3>
              <p className="text-14 text-ink3">{chapterLine}</p>
            </div>

            <Link
              href={watchHref}
              className="flex items-center gap-3.5 rounded-16 border border-line bg-surface px-[18px] py-4 transition-colors hover:border-brand-tint3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-12 bg-brand-tint">
                <Icon name="icon-film" size={22} />
              </span>
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span className="text-115 font-medium text-ink4">次に見る動画</span>
                <span className="truncate text-15 font-bold text-ink">{lessonTitle}</span>
              </div>
              <span className="ml-auto shrink-0 text-13 text-ink3">
                {remainingLabel(lessonId)}
              </span>
            </Link>

            <div className="flex flex-col gap-[9px]">
              <div className="flex items-baseline justify-between">
                <span className="text-13 font-medium text-ink2">学習進捗</span>
                <span className="font-rounded text-20 font-bold text-brand-deep">{percent}%</span>
              </div>
              <ProgressBar percent={percent} height={12} variant="brand" trackColor="#DCEAFB" />
              <span className="text-125 text-ink4">
                {course.totalLessons}本中 {course.completedLessons}本の動画を学習済み
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <Button href={watchHref} size={56}>
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 22, height: 22, background: "rgba(255,255,255,.22)" }}
                >
                  <PlayTriangle size={8} color="#fff" />
                </span>
                学習を続ける
              </Button>
              <Button
                href={courseHref}
                variant="outline"
                size={56}
                className={`px-[26px]! text-15! ${outlineCta}`}
              >
                コースの目次を見る
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {lesson && (
              <Link href={watchHref} className="block overflow-hidden rounded-18 shadow-panel">
                <VideoThumbnail
                  tool={lesson.tool}
                  durationSeconds={lesson.durationSeconds}
                  scale="lg"
                  showPlay={false}
                >
                  <span
                    className="flex items-center justify-center rounded-full shadow-overlay"
                    style={{ width: 56, height: 56, background: "rgba(255,255,255,.94)" }}
                  >
                    <PlayTriangle size={16} color="#3B90F5" />
                  </span>
                </VideoThumbnail>
              </Link>
            )}
            <div className="flex items-center gap-2.5 px-1">
              <Icon name="icon-sparkle-cluster" size={20} />
              <span className="text-125 leading-[1.6] text-ink3">
                あと{restLessons}本でこのコースを修了できます
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
