"use client";

/* eslint-disable @next/next/no-img-element */

import { Icon } from "@/components/ui/Icon";
import {
  categories,
  levelFilterLabel,
  levelFilterOrder,
  toolFilterOrder,
  tools,
} from "@/lib/mock";
import type { CategoryKey, Level, ToolKey } from "@/lib/types";
import {
  toggleTool,
  watchFilterOptions,
  type VideoFilterState,
  type WatchFilter,
} from "./videoFilters";

/** サイドバーの選択ピル（高さ 30px） */
function SidePill({
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
      className={`flex h-[30px] cursor-pointer items-center rounded-full px-3 text-125 transition-colors ${
        active
          ? "bg-brand font-bold text-white"
          : "border border-line bg-page text-ink2 hover:border-brand-tint2 hover:bg-brand-tint hover:text-brand-deep"
      }`}
    >
      {children}
    </button>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-125 font-bold text-ink2">{children}</span>;
}

function Divider() {
  return <div className="h-px bg-surface-alt" />;
}

/**
 * 動画一覧 PC 版の左サイドバー（絞り込み）。
 * Claude Design「動画一覧.dc.html」の aside をそのまま再現している。
 */
export function VideoFilterSidebar({
  filter,
  onChange,
  onClear,
}: {
  filter: VideoFilterState;
  onChange: (patch: Partial<VideoFilterState>) => void;
  onClear: () => void;
}) {
  return (
    <aside className="sticky top-[100px] flex flex-col gap-4">
      <div className="flex flex-col gap-[26px] rounded-card border border-line bg-surface px-[22px] py-6 shadow-card">
        {/* ヘッダ */}
        <div className="flex items-center gap-[9px]">
          <Icon name="icon-book" size={20} />
          <span className="font-rounded text-15 font-bold text-ink">絞り込み</span>
          <button
            type="button"
            onClick={onClear}
            className="ml-auto cursor-pointer text-12 text-brand-deep hover:text-brand-deeper"
          >
            クリア
          </button>
        </div>

        {/* カテゴリ */}
        <div className="flex flex-col gap-2.5">
          <GroupLabel>カテゴリ</GroupLabel>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <SidePill
                key={c.key}
                active={filter.category === c.key}
                onClick={() => onChange({ category: c.key as CategoryKey })}
              >
                {c.label}
              </SidePill>
            ))}
          </div>
        </div>

        <Divider />

        {/* 使用ツール */}
        <div className="flex flex-col gap-3">
          <GroupLabel>使用ツール</GroupLabel>
          <div className="flex flex-col gap-[11px]">
            {toolFilterOrder.map((key: ToolKey) => {
              const on = filter.toolKeys.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 text-135 text-ink-sub"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onChange({ toolKeys: toggleTool(filter.toolKeys, key) })}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-6 text-12 font-bold ${
                      on ? "bg-brand text-white" : "border-[1.5px] border-line-strong bg-surface"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {tools[key].name}
                </label>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 難易度 */}
        <div className="flex flex-col gap-2.5">
          <GroupLabel>難易度</GroupLabel>
          <div className="flex flex-wrap gap-1.5">
            {levelFilterOrder.map((level: Level) => {
              const on = filter.level === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ level: on ? null : level })}
                  className={`flex h-[30px] cursor-pointer items-center rounded-full px-3 text-125 transition-colors ${
                    on
                      ? "border border-brand-tint2 bg-brand-tint font-bold text-brand-deep"
                      : "border border-line bg-page text-ink2 hover:border-brand-tint2 hover:bg-brand-tint hover:text-brand-deep"
                  }`}
                >
                  {levelFilterLabel(level)}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 視聴状況 */}
        <div className="flex flex-col gap-2.5">
          <GroupLabel>視聴状況</GroupLabel>
          <div className="flex flex-col gap-2">
            {watchFilterOptions.map((option) => {
              const on = filter.watch === option.key;
              return (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-center gap-2.5 text-135 text-ink-sub"
                >
                  <input
                    type="radio"
                    name="watch-status"
                    checked={on}
                    onChange={() => onChange({ watch: option.key as WatchFilter })}
                    className="sr-only"
                  />
                  <span
                    className="box-border block h-[18px] w-[18px] shrink-0 rounded-full bg-surface"
                    style={{
                      border: on ? "5px solid #3B90F5" : "1.5px solid #D5E3F5",
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 下部プロモカード */}
      <div
        className="flex flex-col items-start gap-2.5 rounded-card border border-brand-tint4 p-5"
        style={{ background: "linear-gradient(180deg,#EAF4FF,#F7FBFF)" }}
      >
        <img
          src="/illust/illust-girl-soft.png"
          alt=""
          className="block h-auto w-full"
        />
        <p className="text-125 leading-[1.8] text-ink-sub2">
          迷ったときは「Premiere Pro 実践コース」の続きから学ぶのがおすすめです。
        </p>
      </div>
    </aside>
  );
}
