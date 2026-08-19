"use client";

import { PlayTriangle } from "@/components/ui/Button";
import { useContent } from "@/lib/content/context";
import { formatDuration } from "@/lib/content/format";
import type { LessonStatus, ToolKey } from "@/lib/types";

/**
 * 動画サムネイル。
 * Claude Design には実画像が 1 枚もなく、すべて
 * 「ツール別グラデーション + ツールバッジ + CSS 三角の再生ボタン」で表現されている。
 * これはデザイン仕様なのでそのまま踏襲する。
 */
export type ThumbScale = "sm" | "md" | "lg";

const scaleSpec: Record<
  ThumbScale,
  {
    play: number;
    tri: number;
    badgeHeight: number;
    badgePad: number;
    badgeFont: number;
    badgeRadius: number;
    badgeInset: number;
    timeHeight: number;
    timePad: number;
    timeFont: number;
    timeRadius: number;
    timeInset: number;
    progressHeight: number;
  }
> = {
  sm: {
    play: 34,
    tri: 10,
    badgeHeight: 20,
    badgePad: 7,
    badgeFont: 10.5,
    badgeRadius: 6,
    badgeInset: 7,
    timeHeight: 19,
    timePad: 6,
    timeFont: 10.5,
    timeRadius: 5,
    timeInset: 7,
    progressHeight: 4,
  },
  md: {
    play: 46,
    tri: 13,
    badgeHeight: 24,
    badgePad: 9,
    badgeFont: 11.5,
    badgeRadius: 7,
    badgeInset: 10,
    timeHeight: 22,
    timePad: 7,
    timeFont: 11.5,
    timeRadius: 6,
    timeInset: 10,
    progressHeight: 5,
  },
  lg: {
    play: 52,
    tri: 15,
    badgeHeight: 26,
    badgePad: 10,
    badgeFont: 12,
    badgeRadius: 8,
    badgeInset: 12,
    timeHeight: 24,
    timePad: 8,
    timeFont: 12,
    timeRadius: 6,
    timeInset: 12,
    progressHeight: 5,
  },
};

export function VideoThumbnail({
  tool,
  durationSeconds,
  status = "not_started",
  percent = 0,
  scale = "md",
  showPlay = true,
  showDuration = true,
  className = "",
  style,
  children,
}: {
  tool: ToolKey;
  durationSeconds?: number;
  status?: LessonStatus;
  percent?: number;
  scale?: ThumbScale;
  showPlay?: boolean;
  showDuration?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const { tools } = useContent();
  const t = tools[tool];
  const s = scaleSpec[scale];
  const hasProgress = status !== "not_started";

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        aspectRatio: "16 / 9",
        background: `linear-gradient(140deg,${t.gradientFrom},${t.gradientTo})`,
        ...style,
      }}
    >
      <span
        className="absolute flex items-center font-bold"
        style={{
          top: s.badgeInset,
          left: s.badgeInset,
          height: s.badgeHeight,
          paddingInline: s.badgePad,
          borderRadius: s.badgeRadius,
          background: "rgba(255,255,255,.92)",
          fontSize: s.badgeFont,
          color: t.ink,
          lineHeight: 1,
        }}
      >
        {t.badge}
      </span>

      {showPlay && (
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: s.play,
            height: s.play,
            background: "rgba(255,255,255,.9)",
          }}
        >
          <PlayTriangle size={s.tri} color={t.ink} />
        </span>
      )}

      {showDuration && durationSeconds !== undefined && (
        <span
          className="absolute flex items-center text-white"
          style={{
            bottom: s.timeInset,
            right: s.timeInset,
            height: s.timeHeight,
            paddingInline: s.timePad,
            borderRadius: s.timeRadius,
            background: "rgba(16,29,51,.72)",
            fontSize: s.timeFont,
            lineHeight: 1,
          }}
        >
          {formatDuration(durationSeconds)}
        </span>
      )}

      {hasProgress && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: s.progressHeight, background: "rgba(255,255,255,.35)" }}
        >
          <div
            className="h-full"
            style={{
              width: `${status === "completed" ? 100 : percent}%`,
              background: status === "completed" ? "#2E9367" : "#3B90F5",
            }}
          />
        </div>
      )}

      {children}
    </div>
  );
}
