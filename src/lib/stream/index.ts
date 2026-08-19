import "server-only";

import type { PlaybackSource, VideoStreamProvider } from "./types";

export type { PlaybackSource, VideoStreamProvider } from "./types";

/**
 * 動画配信プロバイダの選択。
 *
 * Phase 3（現在）:
 *   Cloudflare Stream の資格情報が無いので、常にダミーを返す。
 *   画面は今までどおりのダミープレイヤーを表示する。
 *
 * Phase 4:
 *   ここに CloudflareStreamProvider を実装して差し込むだけでよい。
 *   環境変数が揃っていない環境（ローカル等）では自動的にダミーへ退避する。
 */

/** 資格情報が揃っているか（Phase 4 で実装を足したときの切り替え条件） */
function isCloudflareConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_STREAM_API_TOKEN &&
      process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID &&
      process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM,
  );
}

/** Phase 3 のダミー実装。再生はせず、プレイヤーが従来の見た目を出すだけ */
const placeholderProvider: VideoStreamProvider = {
  name: "placeholder",
  isConfigured: () => true,
  async createPlaybackSource({ streamVideoId }) {
    return {
      kind: "placeholder",
      reason: streamVideoId ? "not-configured" : "no-stream-id",
    };
  },
};

export function getVideoStreamProvider(): VideoStreamProvider {
  if (isCloudflareConfigured()) {
    // Phase 4: return new CloudflareStreamProvider()
    // 実装を足すまではダミーのまま（設定だけ先に入っても壊れないようにする）
    return placeholderProvider;
  }
  return placeholderProvider;
}

/**
 * 動画閲覧ページから呼ぶ入口。
 *
 * 「このユーザーがこのレッスンを視聴してよいか」の判定は
 * Supabase の RLS（公開済みコンテンツのみ SELECT 可）と、
 * 将来は user_course_enrollments で担保する。
 * ここでは既に取得できたレッスンに対する再生ソースの発行だけを行う。
 */
export async function createPlaybackSource(input: {
  streamVideoId: string | null | undefined;
  userId: string;
  ttlSeconds?: number;
}): Promise<PlaybackSource> {
  return getVideoStreamProvider().createPlaybackSource(input);
}
