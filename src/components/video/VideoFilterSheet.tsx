"use client";

import { useEffect } from "react";
import {
  categories,
  levelFilterLabel,
  levelFilterOrder,
  toolFilterOrder,
  tools,
} from "@/lib/mock";
import type { CategoryKey, Level } from "@/lib/types";
import {
  toggleTool,
  watchFilterOptions,
  type VideoFilterState,
  type WatchFilter,
} from "./videoFilters";

/** シート内の選択ピル（高さ 36px） */
function SheetPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 cursor-pointer items-center rounded-full px-3.5 text-13 transition-colors ${
        active
          ? "border border-brand-tint2 bg-brand-tint font-bold text-brand-deep"
          : "border border-line bg-surface-subtle text-ink2"
      }`}
    >
      {children}
    </button>
  );
}

function SheetGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-125 font-bold text-ink2">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * 動画一覧 Mobile 版のフィルター ボトムシート。
 * Claude Design「動画一覧 - Mobile.dc.html」の filterOpen ブロックの再現。
 */
export function VideoFilterSheet({
  open,
  filter,
  resultCount,
  onChange,
  onClear,
  onClose,
}: {
  open: boolean;
  filter: VideoFilterState;
  /** 「n件を表示」に出す件数 */
  resultCount: number;
  onChange: (patch: Partial<VideoFilterState>) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  // シートを開いている間は背面をスクロールさせない
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(16,29,51,.38)" }}
      />

      <div
        className="relative flex max-h-[86%] w-full flex-col gap-[22px] overflow-y-auto bg-surface px-4 pb-7 pt-2.5 shadow-tabbar"
        style={{ borderRadius: "24px 24px 0 0" }}
      >
        <div className="flex flex-col items-center gap-3.5">
          <span className="block h-1 w-10 rounded-full bg-line" />
          <div className="flex w-full items-center">
            <span className="font-rounded text-16 font-bold text-ink">絞り込み</span>
            <button
              type="button"
              onClick={onClear}
              className="ml-auto cursor-pointer text-125 font-bold text-brand-deep"
            >
              クリア
            </button>
          </div>
        </div>

        <SheetGroup label="カテゴリ">
          {categories.map((c) => (
            <SheetPill
              key={c.key}
              active={filter.category === c.key}
              onClick={() => onChange({ category: c.key as CategoryKey })}
            >
              {c.label}
            </SheetPill>
          ))}
        </SheetGroup>

        <SheetGroup label="使用ツール">
          {toolFilterOrder.map((key) => (
            <SheetPill
              key={key}
              active={filter.toolKeys.includes(key)}
              onClick={() => onChange({ toolKeys: toggleTool(filter.toolKeys, key) })}
            >
              {tools[key].name}
            </SheetPill>
          ))}
        </SheetGroup>

        <SheetGroup label="難易度">
          {levelFilterOrder.map((level: Level) => {
            const on = filter.level === level;
            return (
              <SheetPill
                key={level}
                active={on}
                onClick={() => onChange({ level: on ? null : level })}
              >
                {levelFilterLabel(level)}
              </SheetPill>
            );
          })}
        </SheetGroup>

        <SheetGroup label="視聴状況">
          {watchFilterOptions.map((option) => (
            <SheetPill
              key={option.key}
              active={filter.watch === option.key}
              onClick={() => onChange({ watch: option.key as WatchFilter })}
            >
              {option.label}
            </SheetPill>
          ))}
        </SheetGroup>

        <button
          type="button"
          onClick={onClose}
          className="flex h-[54px] cursor-pointer items-center justify-center rounded-full bg-brand font-rounded text-16 font-bold text-white shadow-btn-lg"
        >
          {resultCount}件を表示
        </button>
      </div>
    </div>
  );
}
