import type { StreamStatus } from "@/lib/stream/video-state";

/**
 * レッスンの動画状態の集計。
 *
 * ■ 「要対応」をひとまとめにしない（REVIEW 04）
 *   「尺が未取得のレッスン 90 本」のような数え方は誤解を招く。
 *   実データは **動画あり 1 本 / 動画なし 89 本** で、
 *   89 本はまだ動画そのものを入れていないだけであり、
 *   「同期に失敗している」わけではない。
 *   運営が次に取るべき行動が違うので、必ず分けて出す。
 */

export type AdminLesson = {
  id: string;
  slug: string;
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  number: number;
  title: string;
  isPublished: boolean;
  streamVideoId: string | null;
  streamStatus: StreamStatus | null;
  streamSyncedAt: string | null;
  streamError: string | null;
  /** DB が持っている尺。実尺と一致しているとは限らない */
  durationSeconds: number;
};

export type VideoBucket =
  /** まだ動画を入れていない */
  | "no_video"
  /** 動画はあるが Cloudflare で処理中 */
  | "processing"
  /** 動画の処理に失敗した */
  | "failed"
  /** 再生できるが、Cloudflare から実尺をまだ取得していない */
  | "unsynced"
  /** 再生でき、実尺も取得済み */
  | "ready";

export function videoBucket(lesson: Pick<
  AdminLesson,
  "streamVideoId" | "streamStatus" | "streamSyncedAt"
>): VideoBucket {
  if (!lesson.streamVideoId) return "no_video";
  if (lesson.streamStatus === "error") return "failed";
  if (lesson.streamStatus !== "ready") return "processing";
  return lesson.streamSyncedAt ? "ready" : "unsynced";
}

export type VideoCounts = Record<VideoBucket, number> & { total: number };

export function countVideoBuckets(lessons: readonly AdminLesson[]): VideoCounts {
  const counts: VideoCounts = {
    no_video: 0,
    processing: 0,
    failed: 0,
    unsynced: 0,
    ready: 0,
    total: lessons.length,
  };
  for (const lesson of lessons) counts[videoBucket(lesson)] += 1;
  return counts;
}

export const bucketLabel: Record<VideoBucket, string> = {
  no_video: "動画未設定",
  processing: "処理中",
  failed: "エラー",
  unsynced: "尺 未取得",
  ready: "公開可",
};

/**
 * 一括同期の対象。
 *
 * **動画を持つレッスンだけ**を対象にする（REVIEW 04）。
 * 動画の無い 89 本に問い合わせても Cloudflare には何も無く、
 * 無駄な API 呼び出しとエラーを生むだけ。
 */
export function syncTargets(lessons: readonly AdminLesson[]): AdminLesson[] {
  return lessons.filter((lesson) => lesson.streamVideoId !== null);
}

/** DB の尺と実尺がずれているか */
export function durationMismatch(
  stored: number,
  actual: number | null,
  toleranceSeconds = 1,
): boolean {
  if (actual === null) return false;
  return Math.abs(stored - actual) > toleranceSeconds;
}
