import { formatDuration, getLesson, getProgress, todayLabel } from "@/lib/mock";

/** "2026-08-18" → "2026/08/18" */
export function formatDate(iso: string): string {
  return iso.replace(/-/g, "/");
}

/** タイムゾーンに依存しないよう、日付は常にローカルの 0 時として組み立てる */
function localDate(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

/** todayLabel（"2026年8月19日（水）"）を基準日として解釈する */
function today(): number {
  const m = todayLabel.match(/(\d+)年(\d+)月(\d+)日/);
  if (!m) return Date.now();
  return localDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** 新着バッジ（Claude Design で NEW が付いていたのは 3 日以内の動画） */
export function isNewLesson(publishedAt: string, withinDays = 3): boolean {
  const m = publishedAt.match(/(\d+)-(\d+)-(\d+)/);
  if (!m) return false;
  const published = localDate(Number(m[1]), Number(m[2]), Number(m[3]));
  return (today() - published) / 86_400_000 <= withinDays;
}

/** 「残り 04:53」 */
export function remainingLabel(lessonId: string): string {
  const lesson = getLesson(lessonId);
  if (!lesson) return "";
  const { positionSeconds } = getProgress(lessonId);
  const rest = Math.max(0, lesson.durationSeconds - positionSeconds);
  return `残り ${formatDuration(rest)}`;
}

/** 「07:52 / 12:45 まで視聴」 */
export function watchedLabel(lessonId: string): string {
  const lesson = getLesson(lessonId);
  if (!lesson) return "";
  const { positionSeconds } = getProgress(lessonId);
  return `${formatDuration(positionSeconds)} / ${formatDuration(lesson.durationSeconds)} まで視聴`;
}

/**
 * 「32本」「14時間20分」を数字と単位に分解する。
 * 数字は font-rounded の大きい文字、単位は小さいグレー文字で描く。
 */
export function splitAmount(text: string): string[] {
  return text.match(/\d+|\D+/g) ?? [text];
}
