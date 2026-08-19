"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { useContent } from "@/lib/content/context";
import { formatDuration } from "@/lib/content/format";
import type { ContentApi } from "@/lib/content/api";

/**
 * 学習履歴の 1 行。
 * PC は grid 180px 1fr 200px の横長カード（学習履歴.dc.html）。
 * Mobile は同じ情報を 1 カラムへ変換し、
 * 「動画一覧 - Mobile」の横長リストカード（152px サムネ + 右カラム）を基準にする。
 */

function rowData(content: ContentApi, lessonId: string) {
  const lesson = content.getLesson(lessonId);
  if (!lesson) return null;

  const course = content.getCourse(lesson.courseId);
  const chapter = content.getChapter(lesson.chapterId);
  const status = content.getLessonStatus(lesson.id);
  const percent = content.getLessonPercent(lesson.id);
  const progress = content.getProgress(lesson.id);
  const done = status === "completed";

  return {
    lesson,
    status,
    percent,
    done,
    href: `/watch/${lesson.id}`,
    courseLine: course
      ? `${course.title}${chapter ? ` ・ Chapter ${chapter.number}` : ""}`
      : "",
    positionLabel: done
      ? "視聴完了"
      : `${formatDuration(progress.positionSeconds)} / ${formatDuration(
          lesson.durationSeconds,
        )}`,
    ctaLabel: done ? "もう一度見る" : "続きから見る",
  };
}

/** CTA（青塗り「続きから見る」/ 白枠「もう一度見る」） */
function Cta({
  href,
  label,
  done,
  className = "",
}: {
  href: string;
  label: string;
  done: boolean;
  className?: string;
}) {
  const base =
    "flex items-center justify-center rounded-full font-rounded font-bold transition-colors";
  const tone = done
    ? "border border-brand-tint2 bg-surface text-brand-deep hover:bg-brand-tint"
    : "bg-brand text-white shadow-btn hover:bg-brand-hover";

  return (
    <Link href={href} className={`${base} ${tone} ${className}`}>
      {label}
    </Link>
  );
}

export function HistoryRowPc({
  lessonId,
  viewedAtLabel,
}: {
  lessonId: string;
  viewedAtLabel: string;
}) {
  const content = useContent();
  const data = rowData(content, lessonId);
  if (!data) return null;
  const { lesson, status, percent, done, href, courseLine, positionLabel } = data;

  return (
    <article
      className="grid items-center gap-5 rounded-card border border-line bg-surface p-[18px] shadow-card transition-all hover:border-brand-tint3 hover:shadow-card-hover"
      style={{ gridTemplateColumns: "180px 1fr 200px" }}
    >
      <Link href={href} className="block">
        <VideoThumbnail
          tool={lesson.tool}
          durationSeconds={lesson.durationSeconds}
          status={status}
          percent={percent}
          scale="sm"
          className="overflow-hidden rounded-14"
          style={{ width: 180 }}
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-[9px]">
          {done ? (
            <Tag tone="success" paddingX={10}>
              ✓ 視聴済み
            </Tag>
          ) : (
            <Tag tone="solid" paddingX={10}>
              視聴中
            </Tag>
          )}
          <span className="text-115 text-ink4">{viewedAtLabel} に視聴</span>
        </div>

        <Link
          href={href}
          className="text-16 font-bold leading-[1.5] text-ink hover:text-brand-deep"
        >
          {lesson.title}
        </Link>

        <span className="text-125 text-ink3">{courseLine}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-115 text-ink4">{positionLabel}</span>
          <span
            className={`font-rounded text-14 font-bold ${
              done ? "text-success" : "text-brand-deep"
            }`}
          >
            {percent}%
          </span>
        </div>
        <ProgressBar percent={percent} height={8} trackColor="#E6EEFA" />
        <Cta href={href} label={data.ctaLabel} done={done} className="h-11 text-135" />
      </div>
    </article>
  );
}

export function HistoryRowMobile({
  lessonId,
  viewedAtLabel,
}: {
  lessonId: string;
  viewedAtLabel: string;
}) {
  const content = useContent();
  const data = rowData(content, lessonId);
  if (!data) return null;
  const { lesson, status, percent, done, href, courseLine, positionLabel } = data;

  return (
    <article className="flex flex-col gap-3 rounded-18 border border-line bg-surface p-3.5 shadow-card">
      <div className="flex items-start gap-3">
        <Link href={href} className="block shrink-0">
          <VideoThumbnail
            tool={lesson.tool}
            durationSeconds={lesson.durationSeconds}
            status={status}
            percent={percent}
            scale="sm"
            className="overflow-hidden rounded-12"
            style={{ width: 152 }}
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {done ? (
              <Tag tone="success" height={22} paddingX={8} fontSize={11}>
                ✓ 視聴済み
              </Tag>
            ) : (
              <Tag tone="solid" height={22} paddingX={8} fontSize={11}>
                視聴中
              </Tag>
            )}
            <span className="truncate text-11 text-ink4">
              {viewedAtLabel} に視聴
            </span>
          </div>

          <Link
            href={href}
            className="line-clamp-2 text-14 font-bold leading-[1.55] text-ink"
          >
            {lesson.title}
          </Link>

          <span className="truncate text-115 text-ink4">{courseLine}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-11 text-ink4">{positionLabel}</span>
          <span
            className={`font-rounded text-135 font-bold ${
              done ? "text-success" : "text-brand-deep"
            }`}
          >
            {percent}%
          </span>
        </div>
        <ProgressBar percent={percent} height={6} trackColor="#E6EEFA" />
        <Cta
          href={href}
          label={data.ctaLabel}
          done={done}
          className="mt-1 h-12 text-145"
        />
      </div>
    </article>
  );
}
