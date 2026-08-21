import "server-only";

import { createSign } from "node:crypto";
import type { PlaybackSource, VideoStreamProvider } from "./types";

/**
 * Cloudflare Stream の署名付き再生ソースを発行する。
 *
 * ■ 方式（Cloudflare 公式の推奨）
 *   Require Signed URLs を有効にした動画は、URL の Video UID 部分を
 *   **署名付きトークン**へ置き換えることで再生できる。
 *   トークンは署名キー（RSA 秘密鍵）を使ってサーバー側でローカル生成する。
 *   毎回 Stream API を叩く方式もあるがレート制限があるため、公式は
 *   署名キー方式を推奨している。
 *
 *   JWT ヘッダ  : { alg: "RS256", kid: <署名キーID> }
 *   JWT ペイロード: { sub: <Video UID>, kid: <署名キーID>, exp, nbf }
 *
 *   再生 URL:
 *     https://customer-<CODE>.cloudflarestream.com/<TOKEN>/iframe
 *     https://customer-<CODE>.cloudflarestream.com/<TOKEN>/manifest/video.m3u8
 *
 * ■ 秘密情報の扱い
 *   署名キーはサーバー専用環境変数からのみ読む。
 *   このファイルは `server-only` なので、クライアントバンドルへ
 *   混入した時点でビルドが失敗する。
 */

/** 署名トークンの既定の有効期限（2 時間）。最大は 24 時間 */
const DEFAULT_TTL_SECONDS = 60 * 60 * 2;

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Cloudflare の署名キーは base64 でエンコードされた PEM として払い出される。
 * 生 PEM をそのまま入れられても動くよう、両方を受け付ける。
 */
function normalizePrivateKey(raw: string): string {
  const value = raw.trim().replace(/\\n/g, "\n");
  if (value.includes("-----BEGIN")) return value;
  return Buffer.from(value, "base64").toString("utf8");
}

/** RS256 で JWT を生成する（署名は Node の crypto。追加依存なし） */
function createSignedToken(input: {
  videoId: string;
  keyId: string;
  privateKeyPem: string;
  ttlSeconds: number;
}): { token: string; expiresAt: Date } {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + input.ttlSeconds;

  const header = { alg: "RS256", kid: input.keyId };
  const payload = {
    sub: input.videoId,
    kid: input.keyId,
    // 時計ずれで即時に無効化されないよう少しだけ前倒しする
    nbf: now - 30,
    exp,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload),
  )}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = base64url(signer.sign(input.privateKeyPem));

  return { token: `${signingInput}.${signature}`, expiresAt: new Date(exp * 1000) };
}

type CloudflareConfig = {
  customerCode: string;
  keyId: string;
  privateKeyPem: string;
};

/** 必要な環境変数が揃っているか確認して読み出す */
function readConfig(): CloudflareConfig | null {
  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  const keyId = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
  const privateKey = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;

  if (!customerCode || !keyId || !privateKey) return null;

  return {
    customerCode,
    keyId,
    privateKeyPem: normalizePrivateKey(privateKey),
  };
}

export function isCloudflareStreamConfigured(): boolean {
  return readConfig() !== null;
}

export function createCloudflareStreamProvider(): VideoStreamProvider {
  return {
    name: "cloudflare-stream",

    isConfigured: () => readConfig() !== null,

    async createPlaybackSource({ streamVideoId, ttlSeconds }): Promise<PlaybackSource> {
      // 動画がまだ紐付いていないレッスンは従来どおりダミープレイヤー
      if (!streamVideoId) {
        return { kind: "placeholder", reason: "no-stream-id" };
      }

      const config = readConfig();
      if (!config) {
        return { kind: "placeholder", reason: "not-configured" };
      }

      try {
        const { token, expiresAt } = createSignedToken({
          videoId: streamVideoId,
          keyId: config.keyId,
          privateKeyPem: config.privateKeyPem,
          ttlSeconds: ttlSeconds ?? DEFAULT_TTL_SECONDS,
        });

        const base = `https://customer-${config.customerCode}.cloudflarestream.com/${token}`;

        return {
          kind: "cloudflare-stream",
          videoId: streamVideoId,
          token,
          customerCode: config.customerCode,
          iframeUrl: `${base}/iframe`,
          hlsUrl: `${base}/manifest/video.m3u8`,
          thumbnailUrl: `${base}/thumbnails/thumbnail.jpg`,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (error) {
        // 署名に失敗してもページ全体は壊さない
        console.error(
          "[stream] Cloudflare Stream の署名トークン生成に失敗しました:",
          error instanceof Error ? error.message : error,
        );
        return { kind: "error", reason: "signing-failed" };
      }
    },
  };
}
