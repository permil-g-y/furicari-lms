import "server-only";

import { interpretVideo, type CloudflareVideo, type VideoState } from "./video-state";

/**
 * Cloudflare Stream の管理 API。
 *
 * ■ 再生用の署名（cloudflare.ts）とは別物
 *   再生は署名キーだけで完結し、API を叩かない（レート制限を避けるため）。
 *   こちらはアップロードと動画情報の取得にだけ使う。**サーバー専用**。
 *
 * ■ 必要な API トークン権限
 *   Account → Stream → **Edit** ひとつで足りる（Edit は Read を含む）。
 *   アカウント全体を操作できるトークンは使わない。
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * アップロードを受け付ける動画の最大長。
 *
 * これを超える動画は、アップロード後の処理で
 * ERR_DURATION_EXCEED_CONSTRAINT になる。
 * 講座の動画は長くても数十分なので 2 時間あれば十分。
 * （Cloudflare 側の上限は 36000 秒 = 10 時間）
 */
const MAX_DURATION_SECONDS = 7200;

type StreamApiConfig = { accountId: string; apiToken: string };

function readConfig(): StreamApiConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

export function isStreamApiConfigured(): boolean {
  return readConfig() !== null;
}

/** Cloudflare API 共通のエンベロープ */
type Envelope<T> = {
  success: boolean;
  result: T | null;
  errors?: { code?: number; message?: string }[];
  messages?: unknown[];
};

export class StreamApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StreamApiError";
  }
}

/**
 * エラーメッセージの組み立て。
 *
 * Cloudflare の数値コードは公式に網羅リストが無いため、
 * コードで分岐せず HTTP ステータスと message をそのまま運営へ見せる。
 * トークンそのものはどこにも出さない。
 */
function describeError(status: number, body: Envelope<unknown> | null): string {
  const detail = body?.errors?.map((e) => e.message).filter(Boolean).join(" / ");
  if (status === 401 || status === 403) {
    return `Cloudflare の認証に失敗しました（${status}）。API トークンの権限（Stream: Edit）を確認してください。${detail ? ` ${detail}` : ""}`;
  }
  if (status === 429) {
    return "Cloudflare 側の上限に達しました。同時にエンコード中の本数か、契約している保存容量を確認してください。";
  }
  return `Cloudflare API がエラーを返しました（${status}）${detail ? `: ${detail}` : ""}`;
}

async function callCloudflare<T>(
  path: string,
  init: RequestInit & { config: StreamApiConfig },
): Promise<T> {
  const { config, ...rest } = init;
  const response = await fetch(`${API_BASE}/accounts/${config.accountId}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    cache: "no-store",
  });

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // JSON で返らない障害時
  }

  if (!response.ok || !body?.success || body.result === null) {
    throw new StreamApiError(describeError(response.status, body), response.status);
  }
  return body.result;
}

export type DirectUpload = {
  /** 動画 ID。**この時点で確定する**ため、照合処理が要らない */
  uid: string;
  /** ブラウザが 1 回だけ POST できる URL */
  uploadUrl: string;
};

/**
 * ワンタイムのアップロード URL を発行する。
 *
 * ■ なぜ動画をサーバーに通さないのか
 *   Vercel の関数にはリクエストボディの上限があり、数百 MB の動画は通せない。
 *   ブラウザから Cloudflare へ直接送る。
 *
 * ■ requireSignedURLs を必ず立てる
 *   Phase 4 で「署名なしの Video UID は 401 になる」ことを実測している。
 *   その前提をここで崩さない。
 */
export async function createDirectUpload(input: {
  lessonSlug: string;
  lessonTitle: string;
}): Promise<DirectUpload> {
  const config = readConfig();
  if (!config) {
    throw new StreamApiError(
      "Cloudflare の管理 API 設定（CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_STREAM_API_TOKEN）がありません。",
      0,
    );
  }

  const result = await callCloudflare<{ uid: string; uploadURL: string }>(
    "/stream/direct_upload",
    {
      config,
      method: "POST",
      body: JSON.stringify({
        maxDurationSeconds: MAX_DURATION_SECONDS,
        requireSignedURLs: true,
        // 後から Cloudflare 側だけを見ても、どのレッスンか分かるようにしておく
        meta: { name: input.lessonTitle, lessonSlug: input.lessonSlug },
      }),
    },
  );

  return { uid: result.uid, uploadUrl: result.uploadURL };
}

/** 動画の処理状態と実尺を取得する */
export async function fetchVideoState(uid: string): Promise<VideoState> {
  const config = readConfig();
  if (!config) {
    throw new StreamApiError("Cloudflare の管理 API 設定がありません。", 0);
  }
  const result = await callCloudflare<CloudflareVideo>(
    `/stream/${encodeURIComponent(uid)}`,
    { config, method: "GET" },
  );
  return interpretVideo(result);
}
