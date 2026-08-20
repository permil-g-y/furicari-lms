/**
 * 動画配信の抽象。
 *
 * Phase 3 時点では実装は「ダミー」だけ。Phase 4 で Cloudflare Stream の
 * 実装を足し、環境変数が揃っていればそちらを使う、という切り替えにする。
 *
 * 画面側（VideoPlayer / MobileVideoPlayer）はこの型だけを見るので、
 * Phase 4 で作り直しが発生しない。
 */

/** プレイヤーへ渡す再生ソース */
export type PlaybackSource =
  | {
      kind: "placeholder";
      /** 再生できない理由（開発中 / 動画未設定 など） */
      reason: "no-stream-id" | "not-configured";
    }
  | {
      kind: "cloudflare-stream";
      /** lessons.stream_video_id */
      videoId: string;
      /**
       * Cloudflare 公式プレイヤーの埋め込み URL（署名付きトークン込み）。
       * URL のパス部分が Video UID ではなく **トークン** になっている点が肝で、
       * これにより Require Signed URLs が有効な動画を再生できる。
       */
      iframeUrl: string;
      /** HLS マニフェスト URL（自前プレイヤーへ寄せるとき用。トークン込み） */
      hlsUrl: string;
      /** サムネイル URL（トークン込み） */
      thumbnailUrl: string;
      /** token の有効期限（ISO 8601） */
      expiresAt: string;
    }
  | {
      kind: "error";
      /** 再生ソースの発行に失敗した。ページ全体は壊さず、その旨だけ出す */
      reason: string;
    };

/**
 * 動画配信プロバイダの共通インターフェース。
 *
 * 実装は必ずサーバー側に置くこと。署名鍵をクライアントへ渡してはいけない。
 */
export type VideoStreamProvider = {
  readonly name: string;
  /** 設定が揃っていて実際に配信できるか */
  isConfigured(): boolean;
  /**
   * 署名付きの再生ソースを発行する。
   * 呼び出し側は事前に「このユーザーがこのレッスンを視聴してよいか」を
   * 検証しておくこと（RLS + 受講権限）。
   */
  createPlaybackSource(input: {
    streamVideoId: string | null | undefined;
    /** 監査・トークンのスコープ用 */
    userId: string;
    /** 有効期限（秒）。既定 2 時間 */
    ttlSeconds?: number;
  }): Promise<PlaybackSource>;
};
