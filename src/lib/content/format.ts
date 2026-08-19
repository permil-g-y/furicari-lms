import type { Level } from "@/lib/types";

/**
 * データに依存しない純粋なフォーマッタ。
 * Server / Client どちらからも普通に import してよい。
 */

/** 秒 → "12:45" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 通し番号 → "05" */
export function formatLessonNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/** コンテンツのタグに出る表記（初心者向け / 中級者向け / 上級者向け） */
export function levelLabel(level: Level): string {
  return { beginner: "初心者向け", intermediate: "中級者向け", advanced: "上級者向け" }[level];
}

/** 絞り込みフィルターに出る短い表記（初心者 / 中級 / 上級） */
export function levelFilterLabel(level: Level): string {
  return { beginner: "初心者", intermediate: "中級", advanced: "上級" }[level];
}

export const levelFilterOrder: Level[] = ["beginner", "intermediate", "advanced"];

/** 分秒指定を秒へ（シードデータ定義を読みやすくするためのヘルパー） */
export function ms(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}
