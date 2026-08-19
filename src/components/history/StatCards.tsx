"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useContent } from "@/lib/content/context";
import type { LearningStats } from "@/lib/types";

/**
 * 学習履歴のサマリーカード。
 * PC は 4 カラムグリッド（学習履歴.dc.html）、
 * Mobile は「フリキャリ TOP - Mobile」の "今週の学習" と同じ
 * min-width:132px の横スクロールカルーセル。
 */

type ValuePart = { num: string; unit: string };

type StatItem = {
  key: string;
  icon: IconName;
  /** アイコンタイル背景 */
  tint: string;
  iconSizePc: number;
  iconSizeMobile: number;
  label: string;
  parts: ValuePart[];
};

/** "14時間20分" → [{14, 時間}, {20, 分}] */
function watchTimeParts(learningStats: LearningStats): ValuePart[] {
  const matched = learningStats.totalWatchTimeLabel.match(/(\d+)時間(\d+)分/);
  if (!matched) {
    return [{ num: learningStats.totalWatchTimeLabel, unit: "" }];
  }
  return [
    { num: matched[1], unit: "時間" },
    { num: matched[2], unit: "分" },
  ];
}

/** 学習履歴のサマリー 4 枚分のデータ（Content API の進捗から組み立てる） */
export function useHistoryStats(): StatItem[] {
  const { learningStats } = useContent();

  return [
    {
      key: "completed",
      icon: "icon-film",
      tint: "bg-brand-tint",
      iconSizePc: 22,
      iconSizeMobile: 19,
      label: "学習済み動画",
      parts: [{ num: String(learningStats.completedLessons), unit: "本" }],
    },
    {
      key: "watch-time",
      icon: "icon-cloud",
      tint: "bg-brand-tint",
      iconSizePc: 24,
      iconSizeMobile: 20,
      label: "総学習時間",
      parts: watchTimeParts(learningStats),
    },
    {
      key: "weekly",
      icon: "icon-book",
      tint: "bg-brand-tint",
      iconSizePc: 22,
      iconSizeMobile: 19,
      label: "今週の学習",
      parts: [{ num: String(learningStats.weeklyLessons), unit: "本" }],
    },
    {
      key: "streak",
      icon: "icon-medal",
      tint: "bg-pink-bg2",
      iconSizePc: 22,
      iconSizeMobile: 19,
      label: "連続学習日数",
      parts: [{ num: String(learningStats.streakDays), unit: "日" }],
    },
  ];
}

function Value({
  parts,
  unitClassName,
}: {
  parts: ValuePart[];
  unitClassName: string;
}) {
  return (
    <>
      {parts.map((part, i) => (
        <span key={part.unit || i}>
          {part.num}
          <span
            className={`${unitClassName} ${
              i === 0 && parts.length > 1 ? "mx-1" : "ml-1"
            }`}
          >
            {part.unit}
          </span>
        </span>
      ))}
    </>
  );
}

/** PC: 4 カラムグリッドのカード */
export function StatCardPc({ item }: { item: StatItem }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-card border border-line bg-surface p-6 shadow-card">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-12 ${item.tint}`}
      >
        <Icon name={item.icon} size={item.iconSizePc} />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-125 font-medium text-ink3">{item.label}</span>
        <span className="font-rounded text-26 font-bold text-ink">
          <Value parts={item.parts} unitClassName="text-14 font-medium text-ink3" />
        </span>
      </div>
    </div>
  );
}

/** Mobile: 横スクロールカルーセルのカード */
export function StatCardMobile({ item }: { item: StatItem }) {
  return (
    <div className="flex min-w-[132px] shrink-0 flex-col gap-2.5 rounded-18 border border-line bg-surface p-4 shadow-card">
      <span
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-11 ${item.tint}`}
      >
        <Icon name={item.icon} size={item.iconSizeMobile} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-115 text-ink3">{item.label}</span>
        <span className="font-rounded text-22 font-bold text-ink">
          <Value parts={item.parts} unitClassName="text-12 font-medium text-ink3" />
        </span>
      </div>
    </div>
  );
}
