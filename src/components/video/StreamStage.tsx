"use client";

import type { PlaybackSource } from "@/lib/stream/types";

/**
 * Cloudflare Stream の再生ステージ。
 *
 * PC / Mobile どちらのプレイヤーからも使う共通部分で、
 * ダミープレイヤーの映像ステージと同じ 16:9・同じ背景色を保つ。
 *
 * URL に埋まっているのは Video UID ではなく **署名付きトークン** で、
 * サーバー側でのみ発行される。トークンには有効期限があり、
 * 署名キーはクライアントへ渡らない。
 */
export function StreamStage({
  playback,
  title,
}: {
  playback: Extract<PlaybackSource, { kind: "cloudflare-stream" } | { kind: "error" }>;
  title: string;
}) {
  if (playback.kind === "error") {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-3 bg-player px-6 text-center"
        style={{ aspectRatio: "16 / 9" }}
      >
        <span className="text-145 font-bold text-white">動画を読み込めませんでした</span>
        <span className="text-125 text-white/70">
          時間をおいてから、もう一度お試しください。
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex h-10 cursor-pointer items-center rounded-full bg-white/12 px-5 text-135 font-bold text-white transition-colors hover:bg-white/22"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-player" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={playback.iframeUrl}
        title={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
