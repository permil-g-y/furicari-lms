import "server-only";

import { createCloudflareStreamProvider, isCloudflareStreamConfigured } from "./cloudflare";
import type { PlaybackSource, VideoStreamProvider } from "./types";

export type { PlaybackSource, VideoStreamProvider } from "./types";

/**
 * 動画配信プロバイダの選択。
 *
 * 資格情報が揃っていれば Cloudflare Stream、揃っていなければダミー。
 * これにより、
 *   - stream_video_id が入っているレッスン → 本物の動画
 *   - stream_video_id が NULL のレッスン    → 従来のダミープレイヤー
 *   - 資格情報が無いローカル環境            → 全部ダミープレイヤー
 * が同じコードで成立する。
 */

/** Phase 3 から使っているダミー実装。再生はせず、従来の見た目を出すだけ */
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
  if (isCloudflareStreamConfigured()) {
    return createCloudflareStreamProvider();
  }
  return placeholderProvider;
}

/**
 * 動画閲覧ページから呼ぶ入口。
 *
 * 「このユーザーがこのレッスンを視聴してよいか」の判定は
 * Supabase の RLS（公開済みコンテンツのみ SELECT 可）と、
 * 呼び出し側の requireUser()（ログイン必須）で担保する。
 * 将来は user_course_enrollments による受講制御もここへ足せる。
 */
export async function createPlaybackSource(input: {
  streamVideoId: string | null | undefined;
  userId: string;
  ttlSeconds?: number;
}): Promise<PlaybackSource> {
  return getVideoStreamProvider().createPlaybackSource(input);
}
