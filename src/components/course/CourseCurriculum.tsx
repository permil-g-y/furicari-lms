"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayTriangle } from "@/components/ui/Button";
import type { ContentApi } from "@/lib/content/api";
import { useContent } from "@/lib/content/context";
import { formatDuration, formatLessonNumber } from "@/lib/content/format";
import type { Chapter, LessonStatus } from "@/lib/types";

/* =========================================================================
   カリキュラム（章アコーディオン）
   Claude Design「コース詳細.dc.html」/「コース詳細 - Mobile.dc.html」の
   state = { open: { 2: true } } を踏襲し、
   「現在学習中の動画がある章」を初期展開する。
   ========================================================================= */

type Variant = "pc" | "mobile";

/** 章ヘッダの状態（番号タイル / 状態ピルの色分けに使う） */
function chapterState(content: ContentApi, chapterId: string) {
  const stats = content.getChapterStats(chapterId);
  return {
    ...stats,
    /** 全完了 */
    allDone: stats.isCompleted,
  };
}

function useOpenChapters(chapters: Chapter[], content: ContentApi) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const chapter of chapters) {
      if (content.getChapterStats(chapter.id).hasCurrent) initial[chapter.id] = true;
    }
    // 視聴中の動画がないコース（未開始・完了）は全章が閉じた状態になってしまうため、
    // Chapter 1 だけ開いておく
    if (Object.keys(initial).length === 0 && chapters.length > 0) {
      initial[chapters[0].id] = true;
    }
    return initial;
  });

  const toggle = (chapterId: string) =>
    setOpen((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));

  return { open, toggle };
}

/* ------------------------------------------------------------------ *
 * PC 版
 * ------------------------------------------------------------------ */
function numTileClass(hasCurrent: boolean, allDone: boolean): string {
  if (hasCurrent) return "bg-brand text-white";
  if (allDone) return "bg-success-bg text-success";
  return "bg-page text-ink4";
}

function statusPill(
  hasCurrent: boolean,
  allDone: boolean,
  completedCount: number,
  total: number,
): { label: string; className: string } {
  if (allDone) {
    return { label: "✓ 完了", className: "bg-success-bg text-success" };
  }
  if (hasCurrent) {
    return { label: "学習中", className: "bg-brand text-white" };
  }
  if (completedCount > 0) {
    return {
      label: `${completedCount}/${total}本`,
      className: "border border-line bg-page text-ink4",
    };
  }
  return { label: "未視聴", className: "border border-line bg-page text-ink4" };
}

function playCircleClass(status: LessonStatus): string {
  if (status === "in_progress")
    return "bg-brand shadow-[0_3px_8px_rgba(59,144,245,.35)]";
  if (status === "completed") return "bg-success-bg";
  return "bg-page";
}

function playTriangleColor(status: LessonStatus): string {
  if (status === "in_progress") return "#fff";
  if (status === "completed") return "#2E9367";
  return "#9BB1CC";
}

function lessonBadge(status: LessonStatus): {
  label: string;
  className: string;
} {
  if (status === "in_progress")
    return { label: "視聴中", className: "bg-brand text-white" };
  if (status === "completed")
    return { label: "✓ 視聴済み", className: "bg-success-bg text-success" };
  return { label: "未視聴", className: "border border-line bg-page text-ink4" };
}

function CurriculumPc({ courseId }: { courseId: string }) {
  const content = useContent();
  const chapters = content.getChaptersByCourse(courseId);
  const { open, toggle } = useOpenChapters(chapters, content);

  return (
    <div className="flex flex-col gap-3.5">
      {chapters.map((chapter) => {
        const { lessons, total, completedCount, hasCurrent, allDone, durationLabel } =
          chapterState(content, chapter.id);
        const isOpen = !!open[chapter.id];
        const pill = statusPill(hasCurrent, allDone, completedCount, total);

        return (
          <div
            key={chapter.id}
            className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(chapter.id)}
              aria-expanded={isOpen}
              className={`flex w-full cursor-pointer select-none items-center gap-4 px-6 py-[22px] text-left ${
                isOpen ? "bg-surface-subtle2" : ""
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-14 font-rounded text-15 font-bold ${numTileClass(
                  hasCurrent,
                  allDone,
                )}`}
              >
                {formatLessonNumber(chapter.number)}
              </span>

              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-rounded text-165 font-bold text-ink">
                  Chapter {chapter.number}　{chapter.title}
                </span>
                <span className="text-125 text-ink4">
                  {total}本 ・ {durationLabel} ・ {completedCount}本視聴済み
                </span>
              </div>

              <span
                className={`ml-auto flex h-7 shrink-0 items-center rounded-full px-3 text-12 font-bold ${pill.className}`}
              >
                {pill.label}
              </span>

              <span
                className="shrink-0 text-20 leading-none text-ink4 transition-transform duration-200"
                style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}
              >
                ⌄
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-surface-alt px-3 pb-3 pt-2">
                {lessons.map((lesson) => {
                  const status = content.getLessonStatus(lesson.id);
                  const current = status === "in_progress";
                  const badge = lessonBadge(status);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/watch/${lesson.id}`}
                      className={`flex items-center gap-3.5 rounded-14 px-4 py-3.5 ${
                        current
                          ? "border border-brand-tint2 bg-brand-tint"
                          : "border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${playCircleClass(
                          status,
                        )}`}
                      >
                        <PlayTriangle size={8} color={playTriangleColor(status)} />
                      </span>

                      <span
                        className={`w-[22px] shrink-0 font-rounded text-13 font-bold ${
                          current ? "text-brand-deep" : "text-ink4"
                        }`}
                      >
                        {formatLessonNumber(lesson.number)}
                      </span>

                      <span
                        className={`min-w-0 flex-1 text-145 leading-[1.5] ${
                          current
                            ? "font-bold text-ink"
                            : status === "completed"
                              ? "text-ink2"
                              : "text-ink-sub"
                        }`}
                      >
                        {lesson.title}
                      </span>

                      <span
                        className={`flex h-6 shrink-0 items-center rounded-full px-2.5 text-115 font-bold ${badge.className}`}
                      >
                        {badge.label}
                      </span>

                      <span className="w-[52px] shrink-0 text-right text-125 text-ink4">
                        {formatDuration(lesson.durationSeconds)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile 版
 * ------------------------------------------------------------------ */
function CurriculumMobile({ courseId }: { courseId: string }) {
  const content = useContent();
  const chapters = content.getChaptersByCourse(courseId);
  const { open, toggle } = useOpenChapters(chapters, content);

  return (
    <div className="flex flex-col gap-2.5 px-4">
      {chapters.map((chapter) => {
        const { lessons, total, completedCount, hasCurrent, allDone } =
          chapterState(content, chapter.id);
        const isOpen = !!open[chapter.id];

        return (
          <div
            key={chapter.id}
            className="overflow-hidden rounded-18 border border-line bg-surface shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(chapter.id)}
              aria-expanded={isOpen}
              className={`flex w-full cursor-pointer select-none items-center gap-3 px-4 py-3.5 text-left ${
                isOpen ? "bg-surface-subtle2" : ""
              }`}
            >
              <span
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-12 font-rounded text-135 font-bold ${numTileClass(
                  hasCurrent,
                  allDone,
                )}`}
              >
                {formatLessonNumber(chapter.number)}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="font-rounded text-145 font-bold leading-[1.4] text-ink">
                  Chapter {chapter.number}　{chapter.title}
                </span>
                <span className="text-11 text-ink4">
                  {total}本 ・ {completedCount}本視聴済み
                </span>
              </div>

              <span
                className="shrink-0 text-18 leading-none text-ink4 transition-transform duration-200"
                style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}
              >
                ⌄
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-0.5 border-t border-surface-alt px-2 pb-2.5 pt-1.5">
                {lessons.map((lesson) => {
                  const status = content.getLessonStatus(lesson.id);
                  const current = status === "in_progress";
                  const finished = status === "completed";
                  const badge = lessonBadge(status);

                  return (
                    <Link
                      key={lesson.id}
                      href={`/watch/${lesson.id}`}
                      className={`flex items-center gap-[11px] rounded-14 px-2.5 py-[11px] ${
                        current
                          ? "border border-brand-tint2 bg-brand-tint"
                          : "border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-11 font-bold leading-none ${
                          current
                            ? "bg-brand pl-px text-white"
                            : finished
                              ? "bg-success-bg text-success"
                              : "bg-page pl-px text-line-strong2"
                        }`}
                      >
                        {finished ? "✓" : "▶"}
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span
                          className={`text-135 leading-[1.5] ${
                            current
                              ? "font-bold text-ink"
                              : finished
                                ? "text-ink3"
                                : "text-ink-sub"
                          }`}
                        >
                          {formatLessonNumber(lesson.number)}　{lesson.title}
                        </span>
                        <div className="flex items-center gap-[7px]">
                          <span
                            className={`flex h-5 shrink-0 items-center rounded-full px-2 text-105 font-bold ${badge.className}`}
                          >
                            {badge.label.replace("✓ ", "")}
                          </span>
                          <span className="text-11 text-ink4">
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CourseCurriculum({
  courseId,
  variant,
}: {
  courseId: string;
  variant: Variant;
}) {
  return variant === "pc" ? (
    <CurriculumPc courseId={courseId} />
  ) : (
    <CurriculumMobile courseId={courseId} />
  );
}
