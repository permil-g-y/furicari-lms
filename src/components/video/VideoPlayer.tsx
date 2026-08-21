"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/context";
import { formatDuration } from "@/lib/content/format";
import { StreamStage } from "./StreamStage";
import type { PlaybackSource } from "@/lib/stream/types";
import type { ToolKey } from "@/lib/types";

/**
 * 動画閲覧 PC 版のプレイヤー。
 *
 * Phase 4 で Cloudflare Stream の埋め込みに差し替える想定のため、
 * 「16:9 のステージ」と「コントロールバー」をこのコンポーネントに閉じている。
 *
 * ■ Phase 4
 *   サーバーが発行した署名付き再生ソース（playback）が
 *   cloudflare-stream のときだけ Cloudflare 公式プレイヤーを描画する。
 *   stream_video_id が NULL のレッスンは従来どおりダミープレイヤーのまま。
 *
 *   本物のプレイヤーは自前のコントロールを持つため、その場合のみ
 *   下のダミーのコントロールバーは描画しない
 *   （操作できない偽のバーを残すと誤解を招くため）。
 *   Phase 1 のコントロールデザインへ寄せるのは後続 Phase。
 */
export function VideoPlayer({
  streamVideoId,
  playback,
  tool,
  topRightLabel,
  durationSeconds,
  positionSeconds,
  onTime,
  onPause,
}: {
  /** Cloudflare Stream の Video UID（DB 由来。NULL ならダミー） */
  streamVideoId?: string;
  /** サーバーが発行した署名付き再生ソース */
  playback?: PlaybackSource;
  tool: ToolKey;
  /** 右上のピル（例「Chapter 2 ・ 05 / 18」） */
  topRightLabel: string;
  durationSeconds: number;
  positionSeconds: number;
  /** 再生位置が進んだ（Phase 5） */
  onTime?: (seconds: number) => void;
  /** 一時停止した（Phase 5） */
  onPause?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const { tools } = useContent();
  const t = tools[tool];
  const percent =
    durationSeconds > 0
      ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100))
      : 0;

  // 本物の動画がある / 発行に失敗した場合。外枠・角丸・16:9 はダミーと同一。
  if (playback && playback.kind !== "placeholder") {
    return (
      <div className="overflow-hidden rounded-card bg-player shadow-player">
        <StreamStage
          playback={playback}
          title={topRightLabel}
          startSeconds={positionSeconds}
          onTime={onTime}
          onPause={onPause}
        />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-card bg-player shadow-player"
      data-stream-video-id={streamVideoId}
    >
      {/* ---- 映像ステージ（Phase 4 で streamVideoId から <Stream /> に差し替え） ---- */}
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: "16 / 9",
          background: `linear-gradient(140deg,${t.gradientFrom},${t.gradientTo})`,
        }}
      >
        <span
          className="absolute left-4 top-4 flex h-7 items-center rounded-8 px-[11px] text-125 font-bold"
          style={{ background: "rgba(255,255,255,.92)", color: t.ink }}
        >
          {t.badge}
        </span>

        <span
          className="absolute right-4 top-4 flex h-7 items-center rounded-full px-3 text-12 font-medium text-white"
          style={{ background: "rgba(16,29,51,.55)" }}
        >
          {topRightLabel}
        </span>

        <button
          type="button"
          aria-label={playing ? "一時停止" : "再生"}
          onClick={() => setPlaying((p) => !p)}
          className="flex h-[76px] w-[76px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
          style={{
            background: "rgba(255,255,255,.94)",
            boxShadow: "0 6px 18px rgba(0,0,0,.22)",
          }}
        >
          {playing ? (
            <span className="flex gap-1.5">
              <span className="block h-[26px] w-[7px] rounded-[2px] bg-brand" />
              <span className="block h-[26px] w-[7px] rounded-[2px] bg-brand" />
            </span>
          ) : (
            <span
              className="block"
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid #3B90F5",
                borderTop: "14px solid transparent",
                borderBottom: "14px solid transparent",
                marginLeft: 4,
              }}
            />
          )}
        </button>
      </div>

      {/* ---- コントロールバー ---- */}
      <div className="flex flex-col gap-3 bg-player px-5 pb-4 pt-3.5">
        <div className="flex items-center gap-3">
          <div
            className="relative h-1.5 flex-1 cursor-pointer rounded-full"
            style={{ background: "rgba(255,255,255,.22)" }}
          >
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${percent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ left: `${percent}%`, boxShadow: "0 2px 6px rgba(0,0,0,.3)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-[18px]">
          <button
            type="button"
            aria-label={playing ? "一時停止" : "再生"}
            onClick={() => setPlaying((p) => !p)}
            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/20"
            style={{ background: "rgba(255,255,255,.12)" }}
          >
            {playing ? (
              <span className="flex gap-[3px]">
                <span className="block h-[13px] w-[3.5px] rounded-[1px] bg-white" />
                <span className="block h-[13px] w-[3.5px] rounded-[1px] bg-white" />
              </span>
            ) : (
              <span
                className="block"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "11px solid #fff",
                  borderTop: "7px solid transparent",
                  borderBottom: "7px solid transparent",
                  marginLeft: 2,
                }}
              />
            )}
          </button>

          <div className="flex items-center gap-[9px]">
            <span
              className="block h-3.5 w-[18px] rounded-[2px]"
              style={{
                background: "rgba(255,255,255,.85)",
                clipPath: "polygon(0 30%,35% 30%,60% 0,60% 100%,35% 70%,0 70%)",
              }}
            />
            <div
              className="h-[5px] w-[72px] rounded-full"
              style={{ background: "rgba(255,255,255,.22)" }}
            >
              <div
                className="h-full w-[70%] rounded-full"
                style={{ background: "rgba(255,255,255,.85)" }}
              />
            </div>
          </div>

          <span className="tabular text-13" style={{ color: "rgba(255,255,255,.9)" }}>
            {formatDuration(positionSeconds)} / {formatDuration(durationSeconds)}
          </span>

          <div className="ml-auto flex items-center gap-2.5">
            <ControlChip>1.0×</ControlChip>
            <ControlChip>字幕</ControlChip>
            <button
              type="button"
              aria-label="全画面"
              className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-8 text-14 text-white transition-colors hover:bg-white/20"
              style={{ background: "rgba(255,255,255,.12)" }}
            >
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-[30px] cursor-pointer items-center rounded-8 px-3 text-125 font-bold text-white transition-colors hover:bg-white/20"
      style={{ background: "rgba(255,255,255,.12)" }}
    >
      {children}
    </button>
  );
}
