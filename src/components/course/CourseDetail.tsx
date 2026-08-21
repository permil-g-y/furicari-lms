"use client";

import Link from "next/link";
import { Button, PlayTriangle } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar, SectionHeading } from "@/components/ui/ProgressBar";
import { CourseStatusBadge, Tag } from "@/components/ui/Tag";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { useContent } from "@/lib/content/context";
import {
  formatDuration,
  formatLessonNumber,
  levelLabel,
} from "@/lib/content/format";
import { useFavorites } from "@/lib/favorites-context";
import type { Course } from "@/lib/types";
import { CourseCurriculum } from "./CourseCurriculum";

/**
 * コース詳細
 * PC: パンくず → ヒーロー → このコースで学べること → カリキュラム
 * Mobile: ヒーロー → 学習進捗カード → 学べること → カリキュラム → 下部固定 CTA
 */
/**
 * 未受講コースで再生 CTA の代わりに出す案内。
 *
 * 新しい色・角丸・影は足さず、既存のトークンだけで作っている。
 * カリキュラムは見えるので「何が学べるか」は確認できる。
 */
/**
 * 「次に見る動画」の外枠。
 *
 * 未受講のコースでは再生ページへ進ませないので、リンクではなくただの箱にする。
 * 余白・角丸・枠線は受講状態で変えない。
 * （サーバー側でも /watch は拒否するが、押しても戻ってくるだけの導線を残さない）
 */
function ResumeLink({
  enrolled,
  href,
  className,
  children,
}: {
  enrolled: boolean;
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (!enrolled) return <div className={className}>{children}</div>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function LockedNotice() {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-line bg-page px-5 py-4">
      <span className="text-135 font-bold text-ink">このコースはまだ受講していません</span>
      <span className="text-125 leading-[1.7] text-ink3">
        内容は自由にご覧いただけます。受講のお手続きは運営までお問い合わせください。
      </span>
    </div>
  );
}

export function CourseDetail({
  course,
  longDescription,
}: {
  course: Course;
  longDescription?: string;
}) {
  const content = useContent();
  const categoryLabel = content.categoryLabel;
  const percent = content.getCoursePercent(course);
  const chapters = content.getChaptersByCourse(course.id);
  const lessons = content.getLessonsByCourse(course.id);
  const resumeLessonId = content.getResumeLessonId(course);
  const resumeLesson = content.getLesson(resumeLessonId);
  const resumeChapter = resumeLesson
    ? content.getChapter(resumeLesson.chapterId)
    : undefined;
  const remainingLessons = course.totalLessons - course.completedLessons;
  const description = longDescription ?? course.description;
  const watchHref = resumeLesson ? `/watch/${resumeLesson.id}` : `/courses/${course.id}`;

  /** 「残り 06:12」 */
  const remainingLabel = resumeLesson
    ? formatDuration(
        Math.max(
          0,
          resumeLesson.durationSeconds -
            content.getProgress(resumeLesson.id).positionSeconds,
        ),
      )
    : "";

  const { isCourseFavorite, toggleCourse } = useFavorites();
  const favorite = isCourseFavorite(course.id);

  const percentClass = percent >= 100 ? "text-success" : "text-brand-deep";

  return (
    <>
      {/* ---------------- Mobile ---------------- */}
      <div className="lg:hidden">
        <main className="mx-auto flex w-full max-w-[560px] flex-col gap-7 pb-[128px] pt-4">
          <section className="flex flex-col gap-3.5 px-4">
            {resumeLesson && (
              <ResumeLink enrolled={course.isEnrolled} href={watchHref} className="block">
                <VideoThumbnail
                  tool={resumeLesson.tool}
                  scale="md"
                  showDuration={false}
                  className="overflow-hidden rounded-16"
                />
              </ResumeLink>
            )}

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <CourseStatusBadge
                  status={course.status}
                  height={24}
                  fontSize={11}
                  className="px-2.5!"
                />
                <Tag tone="white" height={24} paddingX={10} fontSize={11} className="text-ink2!">
                  {categoryLabel(course.category)}
                </Tag>
                <Tag tone="white" height={24} paddingX={10} fontSize={11} className="text-ink2!">
                  {levelLabel(course.level)}
                </Tag>
                <Tag tone="white" height={24} paddingX={10} fontSize={11} className="text-ink2!">
                  全{course.totalLessons}本 / {course.durationLabel}
                </Tag>
              </div>

              <h1 className="font-rounded text-21 font-bold leading-[1.45] text-ink">
                {course.title}
              </h1>
              <p className="text-pretty text-135 leading-[1.85] text-ink-sub2">
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-18 border border-brand-tint4 bg-surface p-4 shadow-card">
              <div className="flex items-baseline justify-between">
                <span className="text-125 font-medium text-ink2">学習進捗</span>
                <span className={`font-rounded text-18 font-bold ${percentClass}`}>
                  {percent}%
                </span>
              </div>
              <ProgressBar percent={percent} height={10} trackColor="#E6EEFA" />
              <div className="flex items-center gap-2">
                <span className="flex-1 text-115 text-ink4">
                  {course.totalLessons}本中 {course.completedLessons}本の動画を学習済み
                </span>
                {remainingLessons > 0 && (
                  <>
                    <Icon name="icon-sparkle-cluster" size={16} />
                    <span className="text-115 text-ink3">
                      あと{remainingLessons}本で修了
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          {course.learnPoints && course.learnPoints.length > 0 && (
            <section className="flex flex-col gap-3 px-4">
              <div className="flex items-center gap-2">
                <Icon name="icon-sparkle-cluster" size={20} />
                <h2 className="font-rounded text-16 font-bold text-ink">
                  このコースで学べること
                </h2>
              </div>
              <div className="flex flex-col rounded-18 border border-line bg-surface px-4 py-1.5 shadow-card">
                {course.learnPoints.map((point, index) => (
                  <div
                    key={point.title}
                    className={`flex items-center gap-[11px] py-[13px] ${
                      index > 0 ? "border-t border-page" : ""
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-12 font-bold leading-none text-brand-deep">
                      ✓
                    </span>
                    <span className="flex-1 text-135 leading-[1.65] text-ink-sub">
                      {point.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-4">
              <Icon name="icon-book" size={20} />
              <h2 className="font-rounded text-16 font-bold text-ink">カリキュラム</h2>
              <span className="ml-auto text-115 text-ink4">
                {course.completedLessons} / {course.totalLessons}本 視聴済み
              </span>
            </div>
            <CourseCurriculum courseId={course.id} variant="mobile" />
          </section>
        </main>

        {/* 下部固定 CTA バー（Mobile はタブバーの代わりにこれを出す） */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/97 px-4 pb-6 pt-3 backdrop-blur-[8px]">
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-115 text-ink4">
                次に見る　{resumeLesson ? formatLessonNumber(resumeLesson.number) : ""}
                　{resumeLesson?.title}
              </span>
              <span className={`shrink-0 font-rounded text-13 font-bold ${percentClass}`}>
                {percent}%
              </span>
            </div>
            {course.isEnrolled ? (
              <Button href={watchHref} size={54} block>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <PlayTriangle size={8} />
                </span>
                学習を続ける
              </Button>
            ) : (
              <LockedNotice />
            )}
          </div>
        </div>
      </div>

      {/* ---------------- PC ---------------- */}
      <main className="mx-auto hidden max-w-page flex-col gap-14 px-10 pb-20 pt-8 lg:flex">
        <nav className="flex items-center gap-2 text-13 text-ink4">
          <Link href="/courses" className="text-ink3">
            コース
          </Link>
          <span>〉</span>
          <span className="text-ink2">{course.title}</span>
        </nav>

        <section
          className="grid grid-cols-[1fr_340px] items-center gap-10 rounded-panel border border-brand-tint4 p-8 shadow-soft"
          style={{ background: "linear-gradient(180deg,#EAF4FF 0%,#FBFDFF 62%)" }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <CourseStatusBadge status={course.status} height={28} fontSize={12} />
              <Tag tone="white" height={28} paddingX={12} fontSize={12} className="font-medium text-ink2!">
                {categoryLabel(course.category)}
              </Tag>
              <Tag tone="white" height={28} paddingX={12} fontSize={12} className="font-medium text-ink2!">
                {levelLabel(course.level)}
              </Tag>
              <Tag tone="white" height={28} paddingX={12} fontSize={12} className="font-medium text-ink2!">
                全{course.totalLessons}本 / {course.durationLabel}
              </Tag>
            </div>

            <div className="flex flex-col gap-2.5">
              <h1 className="font-rounded text-28 font-bold leading-[1.4] text-ink">
                {course.title}
              </h1>
              <p className="text-pretty text-145 leading-[1.85] text-ink-sub2">
                {description}
              </p>
            </div>

            {resumeLesson && (
              <ResumeLink
                enrolled={course.isEnrolled}
                href={watchHref}
                className="flex items-center gap-3.5 rounded-16 border border-line bg-surface px-[18px] py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-12 bg-brand-tint">
                  <Icon name="icon-film" size={22} />
                </span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="truncate text-115 font-medium text-ink4">
                    次に見る動画　Chapter {resumeChapter?.number}　{resumeChapter?.title}
                  </span>
                  <span className="truncate text-15 font-bold text-ink">
                    {formatLessonNumber(resumeLesson.number)}　{resumeLesson.title}
                  </span>
                </div>
                <span className="ml-auto shrink-0 text-13 text-ink3">
                  残り {remainingLabel}
                </span>
              </ResumeLink>
            )}

            <div className="flex flex-col gap-[9px]">
              <div className="flex items-baseline justify-between">
                <span className="text-13 font-medium text-ink2">学習進捗</span>
                <span className={`font-rounded text-20 font-bold ${percentClass}`}>
                  {percent}%
                </span>
              </div>
              <ProgressBar percent={percent} height={12} trackColor="#DCEAFB" />
              <span className="text-125 text-ink4">
                {course.totalLessons}本中 {course.completedLessons}本の動画を学習済み
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              {course.isEnrolled ? (
                <Button href={watchHref} size={56}>
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/20">
                    <PlayTriangle size={8} />
                  </span>
                  学習を続ける
                </Button>
              ) : (
                <LockedNotice />
              )}

              <button
                type="button"
                onClick={() => toggleCourse(course.id)}
                className="flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-brand-tint2 bg-surface px-[26px] text-15 font-bold text-brand-deep transition-colors hover:bg-brand-tint"
              >
                <Icon name="icon-heart" size={18} style={{ opacity: favorite ? 1 : 0.55 }} />
                {favorite ? "お気に入り追加済み" : "お気に入りに追加"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {resumeLesson && (
              <ResumeLink enrolled={course.isEnrolled} href={watchHref} className="block">
                <VideoThumbnail
                  tool={resumeLesson.tool}
                  durationSeconds={resumeLesson.durationSeconds}
                  scale="lg"
                  className="overflow-hidden rounded-18 shadow-panel"
                />
              </ResumeLink>
            )}
            {remainingLessons > 0 && (
              <div className="flex items-center gap-2.5 px-1">
                <Icon name="icon-sparkle-cluster" size={20} />
                <span className="text-125 leading-[1.6] text-ink3">
                  あと{remainingLessons}本でこのコースを修了できます
                </span>
              </div>
            )}
          </div>
        </section>

        {course.learnPoints && course.learnPoints.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading
              icon="icon-sparkle-cluster"
              title="このコースで学べること"
            />
            <div className="grid grid-cols-2 gap-4">
              {course.learnPoints.map((point) => (
                <div
                  key={point.title}
                  className="flex items-start gap-3.5 rounded-card border border-line bg-surface px-6 py-[22px] shadow-card"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-15 font-bold text-brand-deep">
                    ✓
                  </span>
                  <div className="flex flex-col gap-[5px]">
                    <span className="text-15 font-bold text-ink">{point.title}</span>
                    <span className="text-125 leading-[1.7] text-ink3">{point.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <Icon name="icon-book" size={24} />
            <h2 className="font-rounded text-20 font-bold text-ink">カリキュラム</h2>
            <span className="text-13 text-ink4">
              全{chapters.length}チャプター・{lessons.length}本
            </span>
            <span className="ml-auto text-13 text-ink3">
              視聴済み {course.completedLessons}本 / {course.totalLessons}本
            </span>
          </div>
          <CourseCurriculum courseId={course.id} variant="pc" />
        </section>
      </main>
    </>
  );
}
