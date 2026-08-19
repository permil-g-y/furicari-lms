"use client";

import Link from "next/link";
import { useState } from "react";
import { useContent } from "@/lib/content/context";
import { formatDuration } from "@/lib/content/format";
import type { ToolKey } from "@/lib/types";

/**
 * 動画閲覧 Mobile 版のプレイヤー（没入レイアウトの最上部）。
 * PC 版と同じく Phase 4 で Cloudflare Stream に差し替える前提の独立コンポーネント。
 *
 * ■ Phase 4 の差し替えポイント
 *   `streamVideoId`（= Cloudflare Stream の Video UID）が渡ってきたら、
 *   下の「映像ステージ」を <Stream src={streamVideoId} /> に置き換える。
 *   現時点では全レッスンが `streamVideoId: undefined` なので、
 *   値の有無にかかわらずダミープレイヤーを描画する（見た目を変えない）。
 */
export function MobileVideoPlayer({
  streamVideoId,
  tool,
  backHref,
  indexLabel,
  durationSeconds,
  positionSeconds,
}: {
  /** Phase 4 で Cloudflare Stream の Video UID を受け取る */
  streamVideoId?: string;
  tool: ToolKey;
  /** 左上の「←」の遷移先（コース詳細） */
  backHref: string;
  /** 右上のピル（例「05 / 18」） */
  indexLabel: string;
  durationSeconds: number;
  positionSeconds: number;
}) {
  const [playing, setPlaying] = useState(false);
  const { tools } = useContent();
  const t = tools[tool];
  const percent =
    durationSeconds > 0
      ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100))
      : 0;

  return (
    <div className="bg-player" data-stream-video-id={streamVideoId}>
      {/* ---- 映像ステージ（Phase 4 で streamVideoId から <Stream /> に差し替え） ---- */}
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: "16 / 9",
          background: `linear-gradient(140deg,${t.gradientFrom},${t.gradientTo})`,
        }}
      >
        <Link
          href={backHref}
          aria-label="コースへ戻る"
          className="absolute left-2.5 top-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full text-16 text-white"
          style={{ background: "rgba(16,29,51,.5)" }}
        >
          ←
        </Link>

        <span
          className="absolute right-2.5 top-2.5 flex h-[26px] items-center rounded-full px-2.5 text-11 font-medium text-white"
          style={{ background: "rgba(16,29,51,.5)" }}
        >
          {indexLabel}
        </span>

        <button
          type="button"
          aria-label={playing ? "一時停止" : "再生"}
          onClick={() => setPlaying((p) => !p)}
          className="flex h-[62px] w-[62px] cursor-pointer items-center justify-center rounded-full"
          style={{
            background: "rgba(255,255,255,.94)",
            boxShadow: "0 6px 18px rgba(0,0,0,.22)",
          }}
        >
          {playing ? (
            <span className="flex gap-[5px]">
              <span className="block h-[22px] w-1.5 rounded-[2px] bg-brand" />
              <span className="block h-[22px] w-1.5 rounded-[2px] bg-brand" />
            </span>
          ) : (
            <span
              className="block"
              style={{
                width: 0,
                height: 0,
                borderLeft: "18px solid #3B90F5",
                borderTop: "11px solid transparent",
                borderBottom: "11px solid transparent",
                marginLeft: 3,
              }}
            />
          )}
        </button>
      </div>

      {/* ---- コントロール ---- */}
      <div className="flex flex-col gap-[9px] px-3.5 pb-3 pt-2.5">
        <div
          className="relative h-[5px] rounded-full"
          style={{ background: "rgba(255,255,255,.22)" }}
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          <span
            className="absolute top-1/2 block h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${percent}%`, boxShadow: "0 2px 6px rgba(0,0,0,.3)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular text-115" style={{ color: "rgba(255,255,255,.9)" }}>
            {formatDuration(positionSeconds)} / {formatDuration(durationSeconds)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <MobileChip>1.0×</MobileChip>
            <MobileChip>字幕</MobileChip>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-8 text-13 text-white"
              style={{ background: "rgba(255,255,255,.12)" }}
            >
              ⛶
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex h-7 items-center rounded-8 px-2.5 text-115 font-bold text-white"
      style={{ background: "rgba(255,255,255,.12)" }}
    >
      {children}
    </span>
  );
}
