/**
 * Cloudflare Stream が返す動画の状態を、アプリが扱う形へ翻訳する。
 *
 * 純粋関数だけを置く。ここを間違えると
 * 「処理中の動画を公開してしまう」「尺が -1 のまま保存される」といった
 * 実害のある不具合になるため、テストで固定しておきたい。
 */

/** lessons.stream_status と同じ値 */
export type StreamStatus = "pending" | "ready" | "error";

/**
 * Cloudflare の status.state。公式スキーマ上はこの 7 値。
 * 知らない値が来ても落とさず「処理中」として扱う。
 */
export type CloudflareState =
  | "pendingupload"
  | "downloading"
  | "queued"
  | "inprogress"
  | "ready"
  | "error"
  | "live-inprogress";

export type CloudflareVideo = {
  uid?: string;
  /** -1 は「まだ分からない」。アップロード完了前はこの値になる */
  duration?: number;
  readyToStream?: boolean;
  status?: {
    state?: string;
    /** 公式スキーマ上は **文字列**（例 "39.000000"） */
    pctComplete?: string;
    errorReasonCode?: string;
    errorReasonText?: string;
    /** ドキュメント上に表記ゆれがあるため両方読む */
    errReasonCode?: string;
    errReasonText?: string;
  };
};

export type VideoState = {
  status: StreamStatus;
  /** 秒。まだ分からない場合は null（-1 をそのまま保存しない） */
  durationSeconds: number | null;
  /** 0〜100。分からない場合は null */
  percent: number | null;
  /** 失敗理由。運営が原因を見て判断できるようにする */
  error: string | null;
};

/** Cloudflare が -1 で「不明」を表すため、そのまま保存しないようにする */
export function normalizeDuration(duration: unknown): number | null {
  if (typeof duration !== "number") return null;
  if (!Number.isFinite(duration)) return null;
  if (duration < 0) return null;
  // 0.1 秒未満は Cloudflare 側でもエラー扱いになる長さなので信用しない
  if (duration < 0.1) return null;
  return Math.round(duration);
}

/** pctComplete は文字列で返る */
export function normalizePercent(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export function interpretVideo(video: CloudflareVideo): VideoState {
  const state = video.status?.state;
  const durationSeconds = normalizeDuration(video.duration);
  const percent = normalizePercent(video.status?.pctComplete);

  if (state === "error") {
    const code = video.status?.errorReasonCode ?? video.status?.errReasonCode;
    const text = video.status?.errorReasonText ?? video.status?.errReasonText;
    return {
      status: "error",
      durationSeconds,
      percent,
      error: [code, text].filter(Boolean).join(": ") || "原因不明のエラー",
    };
  }

  /*
   * 「ready」は state だけで判断しない。
   * 公式も、画質を優先するなら state が ready **かつ** pctComplete が 100
   * になってから再生を解禁するよう案内している。
   * ここで早まると、低画質のまま受講生に配ることになる。
   */
  const encoded = state === "ready" && video.readyToStream === true;
  if (encoded && (percent === null || percent >= 100)) {
    return { status: "ready", durationSeconds, percent, error: null };
  }

  return { status: "pending", durationSeconds, percent, error: null };
}

/**
 * 公開してよいか。
 *
 * **UI の disabled ではなくサーバー側で判定する**ための関数（REVIEW 03）。
 * 動画を持たないレッスン（テキスト教材など）は対象外なので公開できる。
 */
export function canPublishLesson(lesson: {
  streamVideoId: string | null;
  streamStatus: StreamStatus | null;
}): { ok: true } | { ok: false; reason: string } {
  if (!lesson.streamVideoId) return { ok: true };
  if (lesson.streamStatus === "ready") return { ok: true };
  if (lesson.streamStatus === "error") {
    return { ok: false, reason: "動画の処理に失敗しています。動画を入れ直してください。" };
  }
  return {
    ok: false,
    reason: "動画がまだ処理中です。処理が完了してから公開できます。",
  };
}
