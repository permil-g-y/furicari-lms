"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { LessonStatusBadge, Tag } from "@/components/ui/Tag";
import { VideoThumbnail } from "./VideoThumbnail";
import { useFavorites } from "@/lib/favorites-context";
import {
  categoryLabel,
  formatDuration,
  getChapter,
  getCourse,
  getLessonPercent,
  getLessonStatus,
  levelLabel,
} from "@/lib/mock";
import type { Lesson } from "@/lib/types";

/** ハートボタン（お気に入り済みは opacity 1、未登録は .4） */
export function FavoriteHeart({
  lessonId,
  size = 20,
  className = "",
}: {
  lessonId: string;
  size?: number;
  className?: string;
}) {
  const { isLessonFavorite, toggleLesson } = useFavorites();
  const on = isLessonFavorite(lessonId);

  return (
    <button
      type="button"
      aria-label={on ? "お気に入りから削除" : "お気に入りに追加"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLesson(lessonId);
      }}
      className={`block shrink-0 cursor-pointer transition-opacity ${className}`}
      style={{ opacity: on ? 1 : 0.4 }}
    >
      <img
        src="/icons/icon-heart.svg"
        alt=""
        width={size}
        height={size}
        className="block"
        style={{ width: size, height: size }}
      />
    </button>
  );
}

/**
 * PC の 3 カラムグリッド用 動画カード
 * （動画一覧・お気に入り・TOP の新着動画で共通）
 */
export function VideoCardGrid({
  lesson,
  showDescription = true,
  showCourseLine = false,
  showCategory = true,
  showStatus = true,
  footer,
}: {
  lesson: Lesson;
  showDescription?: boolean;
  showCourseLine?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
  footer?: React.ReactNode;
}) {
  const status = getLessonStatus(lesson.id);
  const percent = getLessonPercent(lesson.id);
  const course = getCourse(lesson.courseId);
  const chapter = getChapter(lesson.chapterId);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all hover:border-brand-tint3 hover:shadow-card-hover">
      <Link href={`/watch/${lesson.id}`} className="block">
        <VideoThumbnail
          tool={lesson.tool}
          durationSeconds={lesson.durationSeconds}
          status={status}
          percent={percent}
          scale="md"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 px-[18px] pb-5 pt-[18px]">
        <div className="flex items-start gap-2.5">
          <Link
            href={`/watch/${lesson.id}`}
            className="flex-1 text-155 font-bold leading-[1.55] text-ink hover:text-brand-deep"
          >
            {lesson.title}
          </Link>
          <FavoriteHeart lessonId={lesson.id} className="mt-0.5" />
        </div>

        {showDescription && lesson.description && (
          <p className="text-125 leading-[1.7] text-ink3">{lesson.description}</p>
        )}

        {/* Reference（お気に入り）の並び順は タイトル → 説明 → コース名 → タグ */}
        {showCourseLine && course && (
          <span className="text-115 text-ink4">
            {course.title}
            {chapter && ` ・ Chapter ${chapter.number}`}
          </span>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {showCategory && <Tag tone="default">{categoryLabel(lesson.category)}</Tag>}
          <Tag tone="brand">{levelLabel(lesson.level)}</Tag>
          {showStatus && <LessonStatusBadge status={status} percent={percent} />}
        </div>

        {footer}
      </div>
    </article>
  );
}

/**
 * Mobile の横長リスト用 動画カード
 * （動画一覧 - Mobile。右カラムは高さ 106px 固定で行を揃える）
 */
export function VideoCardList({
  lesson,
  metaLine,
}: {
  lesson: Lesson;
  /** 省略時は「コース名 ・ 12:45」 */
  metaLine?: string;
}) {
  const status = getLessonStatus(lesson.id);
  const percent = getLessonPercent(lesson.id);
  const course = getCourse(lesson.courseId);
  const meta =
    metaLine ?? `${course?.title ?? ""} ・ ${formatDuration(lesson.durationSeconds)}`;

  return (
    <Link
      href={`/watch/${lesson.id}`}
      className="flex items-start gap-3 rounded-18 border border-line bg-surface p-3.5 shadow-card"
    >
      <VideoThumbnail
        tool={lesson.tool}
        durationSeconds={lesson.durationSeconds}
        status={status}
        percent={percent}
        scale="sm"
        className="shrink-0 overflow-hidden rounded-12"
        style={{ width: 152 }}
      />

      <div className="flex h-[106px] min-w-0 flex-1 flex-col">
        <div className="flex h-11 items-start gap-3">
          <span className="line-clamp-2 min-w-0 flex-1 text-14 font-bold leading-[1.55] text-ink">
            {lesson.title}
          </span>
          <FavoriteHeart lessonId={lesson.id} />
        </div>

        <span className="mt-2 truncate text-115 leading-[17px] text-ink4">{meta}</span>

        <div className="mt-auto flex gap-1.5 overflow-hidden">
          <Tag tone="brand" paddingX={10} fontSize={11} className="shrink-0 leading-none">
            {levelLabel(lesson.level)}
          </Tag>
          <LessonStatusBadge status={status} percent={percent} fontSize={11} />
        </div>
      </div>
    </Link>
  );
}
