"use client";

import { Stream, type StreamPlayerApi } from "@cloudflare/stream-react";
import { useRef, useState } from "react";
import type { PlaybackSource } from "@/lib/stream/types";

/**
 * Cloudflare Stream の再生ステージ。
 *
 * PC / Mobile どちらのプレイヤーからも使う共通部分で、
 * ダミープレイヤーの映像ステージと同じ 16:9・同じ背景色を保つ。
 *
 * src に渡しているのは Video UID ではなく **署名付きトークン** で、
 * サーバー側でのみ発行される。トークンには有効期限があり、
 * 署名キーはクライアントへ渡らない。
 *
 * ■ responsive を切っている理由
 *   自前の 16:9 枠に収めて、Phase 1 から続く外枠・角丸・背景色を維持するため
 *   （responsive にすると読み込み完了まで高さが 0 になる）。
 *
 * ■ 前回位置を URL の startTime で渡さない理由
 *   lessons.duration_seconds は編集者が入力する「表示用の尺」で、
 *   アップロード済み動画ファイルの実尺と食い違うことがある
 *   （テスト動画は実尺 58 秒だが、DB 上は 12:45）。
 *   実尺より後ろを startTime に指定すると Cloudflare のプレイヤーは
 *   "An unknown error occurred" になり、再生そのものができなくなる。
 *
 * ■ 再開を timeupdate 起点にしている理由
 *   loadedmetadata は Cloudflare のプレイヤーから通知されないことがある
 *   （実測：preload="metadata" でも再生を始めるまで一度も発火しない）。
 *   timeupdate は確実に届くので、再生が始まった直後の 1 回だけシークする。
 */

/** 終わり際から再開しても意味がないので、この秒数より手前のときだけ再開する */
const RESUME_MARGIN_SECONDS = 5;

/** 再開のシークは「まだ先頭付近にいる」ときだけ行う */
const RESUME_TRIGGER_SECONDS = 3;

/**
 * 読み込み・再生に失敗したときの表示。
 *
 * Cloudflare のプレイヤーは失敗時に英語で "An unknown error occurred" と出すため、
 * 自前の日本語表示に差し替える。よくある原因は署名トークンの失効（既定 2 時間）で、
 * その場合はページを読み込み直せば新しいトークンが発行されて復帰する。
 */
function PlaybackError() {
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

export function StreamStage({
  playback,
  title,
  startSeconds = 0,
  onTime,
  onPause,
}: {
  playback: Extract<PlaybackSource, { kind: "cloudflare-stream" } | { kind: "error" }>;
  title: string;
  /** 前回の再生位置（秒）。実尺の範囲内であればここから再開する */
  startSeconds?: number;
  /** 再生位置が進んだことを伝える（第 2 引数は実際の動画の尺） */
  onTime?: (seconds: number, durationSeconds?: number) => void;
  /** 一時停止したことを伝える */
  onPause?: () => void;
}) {
  const playerRef = useRef<StreamPlayerApi | undefined>(undefined);
  const seeked = useRef(false);
  /** プレイヤー側が再生に失敗した（トークン失効・エンコード未完了など） */
  const [failed, setFailed] = useState(false);

  // サーバー側で署名の発行に失敗していた場合
  if (playback.kind === "error") return <PlaybackError />;
  // 読み込み・再生に失敗した場合
  if (failed) return <PlaybackError />;

  /** プレイヤーが把握している実尺（取れないうちは undefined） */
  const realDuration = (): number | undefined => {
    const duration = playerRef.current?.duration;
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : undefined;
  };

  return (
    <div className="relative bg-player" style={{ aspectRatio: "16 / 9" }}>
      <Stream
        src={playback.token}
        customerCode={playback.customerCode}
        streamRef={playerRef}
        title={title}
        controls
        preload="metadata"
        onTimeUpdate={() => {
          const player = playerRef.current;
          const current = player?.currentTime;
          if (!player || typeof current !== "number") return;

          const duration = realDuration();

          /*
           * 前回位置からの再開。
           * 再生が始まった最初の 1 回だけ、まだ先頭付近にいるときに行う。
           * 実尺が取れていれば範囲内かを確かめ、取れていなくても
           * 実行時のシークは終端で頭打ちになるだけで再生は壊れない。
           */
          if (!seeked.current) {
            seeked.current = true;
            const withinVideo =
              duration === undefined || startSeconds < duration - RESUME_MARGIN_SECONDS;
            if (startSeconds > 0 && current < RESUME_TRIGGER_SECONDS && withinVideo) {
              player.currentTime = startSeconds;
              onTime?.(startSeconds, duration);
              return;
            }
          }

          onTime?.(current, duration);
        }}
        onError={() => setFailed(true)}
        onPause={() => onPause?.()}
        onEnded={() => {
          const duration = realDuration();
          if (duration !== undefined) onTime?.(duration, duration);
          onPause?.();
        }}
        responsive={false}
        height="100%"
        width="100%"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
