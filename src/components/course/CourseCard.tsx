"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CourseStatusBadge, Tag } from "@/components/ui/Tag";
import { useContent } from "@/lib/content/context";
import { levelLabel } from "@/lib/content/format";
import type { Course } from "@/lib/types";

/* =========================================================================
   コース一覧のカード
   PC 版（Claude Design「コース一覧.dc.html」）と Mobile 版（同 - Mobile）で
   カード内部の構造そのものが違うため、コンポーネントを分けている。
   ========================================================================= */

/** カバーのアイコンサイズ（Claude Design 上で medal / chat のみ 46px） */
function coverIconSize(icon: string): number {
  return icon === "icon-medal" || icon === "icon-chat" ? 46 : 48;
}

/** 「18本中 8本 学習済み」 / 「12本すべて学習済み」 */
function progressNote(course: Course): string {
  if (course.status === "not_started") return "まだ学習を始めていません";
  if (course.completedLessons >= course.totalLessons) {
    return `${course.totalLessons}本すべて学習済み`;
  }
  return `${course.totalLessons}本中 ${course.completedLessons}本 学習済み`;
}

function ctaLabel(course: Course): string {
  // 未受講のコースは再生できないので、内容の確認へ誘導する
  if (!course.isEnrolled) return "コースの内容を見る";
  if (course.status === "in_progress") return "学習を続ける";
  if (course.status === "completed") return "復習する";
  return "コースを見る";
}

/**
 * 未受講コースのバッジ。
 * 既存の Tag（muted）だけで作り、新しい色や角丸は足していない。
 */
function LockedTag({ height = 26, fontSize = 11.5 }: { height?: number; fontSize?: number }) {
  return (
    <Tag tone="muted" height={height} paddingX={11} fontSize={fontSize}>
      受講前
    </Tag>
  );
}

/** 白枠 CTA（Claude Design は枠 #BFDCFA・文字 #2C7BE0・本文書体） */
const OUTLINE_CTA =
  "border-brand-tint2! text-brand-deep! font-sans! hover:bg-brand-tint";

/* ------------------------------------------------------------------ *
 * PC 版カード
 * ------------------------------------------------------------------ */
export function CourseCardPc({ course }: { course: Course }) {
  const percent = useContent().getCoursePercent(course);
  const learning = course.status === "in_progress";
  const done = course.status === "completed";
  const href = `/courses/${course.id}`;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-card bg-surface ${
        learning
          ? "border border-brand-tint2 shadow-[0_4px_16px_rgba(59,144,245,.1)]"
          : "border border-line shadow-card"
      }`}
    >
      <div
        className="relative flex h-[132px] items-center justify-center"
        style={{ background: course.cover.bg }}
      >
        {course.isEnrolled ? (
          <CourseStatusBadge
            status={course.status}
            className={`absolute left-3 top-3 ${
              course.status === "not_started" ? "text-ink3!" : ""
            }`}
          />
        ) : (
          <span className="absolute left-3 top-3">
            <LockedTag />
          </span>
        )}

        {course.cover.icon ? (
          <Icon name={course.cover.icon} size={coverIconSize(course.cover.icon)} />
        ) : (
          <span
            className="font-rounded text-28 font-bold"
            style={{ color: course.cover.textColor }}
          >
            {course.cover.text}
          </span>
        )}

        {learning && (
          <Icon
            name="icon-sparkle-duo"
            size={18}
            className="absolute right-[18px] top-4 opacity-85"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 px-5 pb-6 pt-[22px]">
        <h2 className="font-rounded text-17 font-bold leading-[1.5] text-ink">
          {course.title}
        </h2>
        <p className="text-pretty text-125 leading-[1.75] text-ink3">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Tag>全{course.totalLessons}本</Tag>
          <Tag>{course.durationLabel}</Tag>
          <Tag tone="brand">{levelLabel(course.level)}</Tag>
        </div>

        <div className="mt-auto flex flex-col gap-[7px]">
          {course.status === "not_started" ? (
            <>
              <span className="text-115 text-ink4">{progressNote(course)}</span>
              <div className="h-2 rounded-full bg-[#EEF3FA]" />
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-115 text-ink4">{progressNote(course)}</span>
                <span
                  className={`font-rounded text-14 font-bold ${
                    done ? "text-success" : "text-brand-deep"
                  }`}
                >
                  {percent}%
                </span>
              </div>
              <ProgressBar percent={percent} height={8} trackColor="#E6EEFA" />
            </>
          )}
        </div>

        {learning ? (
          <Button href={href} size={46} block>
            {ctaLabel(course)}
          </Button>
        ) : (
          <Button
            href={href}
            variant="outline"
            size={46}
            block
            className={OUTLINE_CTA}
          >
            {ctaLabel(course)}
          </Button>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * Mobile 版カード（56px のアイコンタイル + 右に状態ピル / タイトル / タグ）
 * ------------------------------------------------------------------ */
export function CourseCardMobile({ course }: { course: Course }) {
  const percent = useContent().getCoursePercent(course);
  const learning = course.status === "in_progress";
  const done = course.status === "completed";
  const href = `/courses/${course.id}`;

  const stateClass = !course.isEnrolled
    ? "border border-line bg-page text-ink3"
    : learning
      ? "bg-brand text-white"
      : done
        ? "bg-success-bg text-success"
        : "border border-line bg-page text-ink3";

  return (
    <article
      className={`flex flex-col gap-3 rounded-card bg-surface p-4 ${
        learning
          ? "border border-brand-tint2 shadow-[0_4px_16px_rgba(59,144,245,.1)]"
          : "border border-line shadow-card"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-16"
          style={{ background: course.cover.bg }}
        >
          {course.cover.icon ? (
            <Icon name={course.cover.icon} size={28} />
          ) : (
            <span
              className="font-rounded text-19 font-bold"
              style={{ color: course.cover.textColor }}
            >
              {course.cover.text}
            </span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
          <span
            className={`flex h-[22px] shrink-0 items-center self-start rounded-full px-2.5 text-11 font-bold ${stateClass}`}
          >
            {!course.isEnrolled
              ? "受講前"
              : learning
                ? "学習中"
                : done
                  ? "✓ 完了"
                  : "未開始"}
          </span>
          <h2 className="font-rounded text-16 font-bold leading-[1.45] text-ink">
            {course.title}
          </h2>
          <div className="flex flex-wrap gap-[5px]">
            <Tag height={22} paddingX={8} fontSize={11}>
              全{course.totalLessons}本
            </Tag>
            <Tag height={22} paddingX={8} fontSize={11}>
              {course.durationLabel}
            </Tag>
            <Tag tone="brand" height={22} paddingX={8} fontSize={11}>
              {levelLabel(course.level)}
            </Tag>
          </div>
        </div>
      </div>

      <p className="text-pretty text-125 leading-[1.75] text-ink3">
        {course.description}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-11 text-ink4">{progressNote(course)}</span>
          <span
            className={`font-rounded text-135 font-bold ${
              done ? "text-success" : "text-brand-deep"
            }`}
          >
            {course.status === "not_started" ? "" : `${percent}%`}
          </span>
        </div>
        <ProgressBar percent={percent} height={8} trackColor="#E6EEFA" />
      </div>

      {learning ? (
        <Button href={href} size={48} block>
          {ctaLabel(course)}
        </Button>
      ) : (
        <Button
          href={href}
          variant="outline"
          size={48}
          block
          className={OUTLINE_CTA}
        >
          {ctaLabel(course)}
        </Button>
      )}
    </article>
  );
}
