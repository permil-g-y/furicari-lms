"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { Tag } from "@/components/ui/Tag";
import { useFavorites } from "@/lib/favorites-context";
import { useContent } from "@/lib/content/context";
import {
  formatDuration,
  formatLessonNumber,
  levelLabel,
} from "@/lib/content/format";
import type { Lesson } from "@/lib/types";
import { MobileVideoPlayer } from "./MobileVideoPlayer";
import { VideoPlayer } from "./VideoPlayer";
import type { PlaybackSource } from "@/lib/stream/types";
import { CurriculumPanel, MobileCurriculum } from "./WatchCurriculum";

export function WatchView({
  lessonId,
  playback,
}: {
  lessonId: string;
  /** サーバーが発行した署名付き再生ソース（Phase 4） */
  playback?: PlaybackSource;
}) {
  const content = useContent();
  const { categoryLabel, tools } = content;
  const lesson = content.getLesson(lessonId)!;
  const course = content.getCourse(lesson.courseId);
  const chapter = content.getChapter(lesson.chapterId);
  const progress = content.getProgress(lesson.id);
  const { prev, next } = content.getAdjacentLessons(lesson.id);
  const totalInCourse = content.getLessonsByCourse(lesson.courseId).length;
  const { isLessonFavorite, toggleLesson } = useFavorites();

  const [watched, setWatched] = useState(
    content.getLessonStatus(lesson.id) === "completed",
  );
  const [tab, setTab] = useState<"about" | "list">("about");

  const favorite = isLessonFavorite(lesson.id);
  const numberLabel = formatLessonNumber(lesson.number);
  const heading = `${numberLabel}　${lesson.title}`;
  const courseHref = course ? `/courses/${course.id}` : "/courses";
  const description = lesson.description ?? course?.description ?? "";
  const keyPoints = lesson.keyPoints ?? [];

  /** 視聴状況ピル */
  const statusPill = (height: number, fontSize: number) => {
    if (watched) {
      return (
        <Tag tone="success" height={height} paddingX={height >= 28 ? 12 : 10} fontSize={fontSize}>
          ✓ 視聴済み
        </Tag>
      );
    }
    if (progress.status === "in_progress") {
      return (
        <Tag tone="solid" height={height} paddingX={height >= 28 ? 12 : 10} fontSize={fontSize}>
          視聴中
        </Tag>
      );
    }
    return (
      <Tag tone="muted" height={height} paddingX={height >= 28 ? 12 : 10} fontSize={fontSize}>
        未視聴
      </Tag>
    );
  };

  return (
    <>
      {/* ================= Mobile ================= */}
      <div className="lg:hidden">
        <MobileVideoPlayer
          streamVideoId={lesson.streamVideoId}
          playback={playback}
          tool={lesson.tool}
          backHref={courseHref}
          indexLabel={`${numberLabel} / ${totalInCourse}`}
          durationSeconds={lesson.durationSeconds}
          positionSeconds={progress.positionSeconds}
        />

        <div className="flex flex-col gap-2.5 border-b border-surface-alt bg-surface px-4 pb-3 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusPill(22, 11)}
            <Tag tone="default" height={22} paddingX={10} fontSize={11} className="border border-line">
              {tools[lesson.tool].name}
            </Tag>
            <Tag tone="brand" height={22} paddingX={10} fontSize={11}>
              {levelLabel(lesson.level)}
            </Tag>
          </div>

          <h1 className="font-rounded text-19 font-bold leading-[1.5] text-ink">{heading}</h1>

          <Link href={courseHref} className="text-12 text-ink3">
            {course?.title}
            {chapter && `　/　Chapter ${chapter.number}`}
          </Link>

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setWatched((w) => !w)}
              className={`flex h-[46px] flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-full text-135 font-bold ${
                watched ? "bg-success-bg text-success" : "bg-brand-tint text-brand-deep"
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-10 leading-none text-white ${
                  watched ? "bg-success" : "bg-brand"
                }`}
              >
                ✓
              </span>
              {watched ? "視聴済み" : "視聴済みにする"}
            </button>
            <button
              type="button"
              aria-label={favorite ? "お気に入りから削除" : "お気に入りに追加"}
              onClick={() => toggleLesson(lesson.id)}
              className={`flex h-[46px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-tint2 ${
                favorite ? "bg-brand-tint" : "bg-surface"
              }`}
            >
              <img
                src="/icons/icon-heart.svg"
                alt=""
                className="block h-5 w-5"
                style={{ opacity: favorite ? 1 : 0.45 }}
              />
            </button>
          </div>
        </div>

        {/* タブ（Reference 通り sticky） */}
        <div className="sticky top-0 z-20 flex gap-6 border-b border-line bg-surface px-4">
          <TabButton active={tab === "about"} onClick={() => setTab("about")}>
            この動画について
          </TabButton>
          <TabButton active={tab === "list"} onClick={() => setTab("list")}>
            カリキュラム
          </TabButton>
        </div>

        <main className="px-4 pb-[120px] pt-4">
          {tab === "about" ? (
            <div className="flex flex-col gap-4">
              {description && (
                <p className="text-14 leading-[1.95] text-ink-sub">{description}</p>
              )}
              {keyPoints.length > 0 && (
                <div className="flex flex-col rounded-18 border border-line bg-surface px-4 py-1.5 shadow-card">
                  {keyPoints.map((point, i) => (
                    <div
                      key={point}
                      className={`flex items-center gap-[11px] py-[13px] ${
                        i > 0 ? "border-t border-page" : ""
                      }`}
                    >
                      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-tint text-11 font-bold leading-none text-brand-deep">
                        ✓
                      </span>
                      <span className="text-135 leading-[1.6] text-ink-sub">{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            course && <MobileCurriculum course={course} currentLessonId={lesson.id} />
          )}
        </main>

        {/* 下部固定バー */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-2.5 border-t border-line px-4 pb-[26px] pt-3 backdrop-blur-[8px] lg:hidden"
          style={{ background: "rgba(255,255,255,.97)" }}
        >
          <MobilePrevButton prev={prev} />
          <MobileNextButton next={next} courseHref={courseHref} courseTitle={course?.title ?? ""} />
        </div>
      </div>

      {/* ================= PC ================= */}
      <main className="mx-auto hidden max-w-page flex-col gap-10 px-10 pb-20 pt-8 lg:flex">
        <nav className="flex items-center gap-2 text-13 text-ink4">
          <Link href="/courses" className="text-ink3 hover:text-brand-deep">
            コース
          </Link>
          <span>〉</span>
          <Link href={courseHref} className="text-ink3 hover:text-brand-deep">
            {course?.title}
          </Link>
          <span>〉</span>
          <span className="text-ink2">{heading}</span>
        </nav>

        <section className="grid grid-cols-[1fr_380px] items-start gap-6">
          <div className="flex flex-col gap-6">
            <VideoPlayer
              streamVideoId={lesson.streamVideoId}
              playback={playback}
              tool={lesson.tool}
              topRightLabel={`${chapter ? `Chapter ${chapter.number} ・ ` : ""}${numberLabel} / ${totalInCourse}`}
              durationSeconds={lesson.durationSeconds}
              positionSeconds={progress.positionSeconds}
            />

            {/* 動画情報カード */}
            <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-7 shadow-card">
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {statusPill(28, 12)}
                  <Tag
                    tone="default"
                    height={28}
                    paddingX={12}
                    fontSize={12}
                    className="border border-line"
                  >
                    {categoryLabel(lesson.category)}
                  </Tag>
                  <Tag tone="brand" height={28} paddingX={12} fontSize={12}>
                    {levelLabel(lesson.level)}
                  </Tag>
                  <Tag
                    tone="default"
                    height={28}
                    paddingX={12}
                    fontSize={12}
                    className="border border-line"
                  >
                    {formatDuration(lesson.durationSeconds)}
                  </Tag>
                </div>

                <h1 className="font-rounded text-26 font-bold leading-[1.45] text-ink">
                  {heading}
                </h1>

                <Link href={courseHref} className="text-135 text-ink3 hover:text-brand-deep">
                  {course?.title}
                  {chapter && `　/　Chapter ${chapter.number}　${chapter.title}`}
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWatched((w) => !w)}
                  className={`flex h-12 cursor-pointer items-center gap-[9px] rounded-full px-[22px] font-rounded text-145 font-bold transition-colors ${
                    watched
                      ? "bg-success-bg text-success"
                      : "bg-brand text-white shadow-btn hover:bg-brand-hover"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-12 ${
                      watched ? "bg-success text-white" : "text-white"
                    }`}
                    style={watched ? undefined : { background: "rgba(255,255,255,.22)" }}
                  >
                    ✓
                  </span>
                  {watched ? "視聴済み" : "視聴済みにする"}
                </button>

                <button
                  type="button"
                  onClick={() => toggleLesson(lesson.id)}
                  className={`flex h-12 cursor-pointer items-center gap-[9px] rounded-full border border-brand-tint2 px-5 text-14 font-bold text-brand-deep transition-colors hover:bg-brand-tint ${
                    favorite ? "bg-brand-tint" : "bg-surface"
                  }`}
                >
                  <img
                    src="/icons/icon-heart.svg"
                    alt=""
                    className="block h-[18px] w-[18px]"
                    style={{ opacity: favorite ? 1 : 0.45 }}
                  />
                  {favorite ? "お気に入り済み" : "お気に入りに追加"}
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-125 text-ink4">使用ツール</span>
                  <span className="flex h-[30px] items-center rounded-full border border-line bg-page px-3 text-125 font-medium text-ink-sub">
                    {tools[lesson.tool].name}
                  </span>
                </div>
              </div>

              <div className="h-px bg-surface-alt" />

              <div className="flex flex-col gap-3">
                <h2 className="font-rounded text-16 font-bold text-ink">この動画について</h2>
                {description && (
                  <p className="text-145 leading-[1.9] text-ink2">{description}</p>
                )}
                {keyPoints.length > 0 && (
                  <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
                    {keyPoints.map((point) => (
                      <li key={point} className="text-135 leading-[1.8] text-ink-sub2">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 前後ナビ */}
            <div className="grid grid-cols-2 gap-4">
              {prev ? (
                <Link
                  href={`/watch/${prev.id}`}
                  className="flex items-center gap-3.5 rounded-card border border-line bg-surface px-[22px] py-5 shadow-card transition-colors hover:border-brand-tint2 hover:bg-surface-subtle2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page text-16 text-ink3">
                    ←
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-115 text-ink4">前の動画</span>
                    <span className="truncate text-14 font-bold text-ink-sub">
                      {formatLessonNumber(prev.number)}　{prev.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              <Link
                href={next ? `/watch/${next.id}` : courseHref}
                className="flex items-center gap-3.5 rounded-card border border-brand bg-brand px-[22px] py-5 text-white shadow-btn-lg transition-colors hover:bg-brand-hover"
              >
                <div className="ml-auto flex min-w-0 flex-col gap-1 text-right">
                  <span className="text-115" style={{ color: "rgba(255,255,255,.8)" }}>
                    {next ? "次の動画" : "コース詳細"}
                  </span>
                  <span className="truncate text-14 font-bold text-white">
                    {next
                      ? `${formatLessonNumber(next.number)}　${next.title}`
                      : (course?.title ?? "コースへ戻る")}
                  </span>
                </div>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-16 text-white"
                  style={{ background: "rgba(255,255,255,.22)" }}
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {course && <CurriculumPanel course={course} currentLessonId={lesson.id} />}
        </section>
      </main>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer py-3.5 text-135 ${
        active
          ? "border-b-[2.5px] border-brand font-bold text-ink"
          : "border-b-[2.5px] border-transparent font-medium text-ink4"
      }`}
    >
      {children}
    </button>
  );
}

function MobilePrevButton({ prev }: { prev?: Lesson }) {
  const className =
    "flex w-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface-subtle text-16 text-ink3";

  if (!prev) {
    return <span className={`${className} opacity-40`}>←</span>;
  }
  return (
    <Link href={`/watch/${prev.id}`} className={className} aria-label="前の動画">
      ←
    </Link>
  );
}

function MobileNextButton({
  next,
  courseHref,
  courseTitle,
}: {
  next?: Lesson;
  courseHref: string;
  courseTitle: string;
}) {
  return (
    <Link
      href={next ? `/watch/${next.id}` : courseHref}
      className="flex min-h-[58px] min-w-0 flex-1 items-center gap-2.5 rounded-18 bg-brand px-3.5 py-[9px] text-white shadow-btn-lg"
    >
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-105 leading-none" style={{ color: "rgba(255,255,255,.82)" }}>
          {next ? "次の動画" : "コース詳細"}
        </span>
        <span className="max-w-full truncate font-rounded text-13 font-bold leading-[1.3] text-white">
          {next ? `${formatLessonNumber(next.number)}　${next.title}` : courseTitle}
        </span>
      </span>
      <span className="shrink-0 text-16 leading-none text-white">→</span>
    </Link>
  );
}
