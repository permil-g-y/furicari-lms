import { Icon } from "@/components/ui/Icon";

/**
 * 学習サマリーのカード。
 * PC は マイページ.dc.html の 4 列グリッド（radius20 / padding24 / アイコン面 40px）、
 * Mobile は フリキャリ TOP - Mobile.dc.html の横スクロールカルーセル
 * （min-width132 / radius18 / padding16 / アイコン面 34px）に合わせている。
 */
export function StatCard({
  icon,
  iconBg,
  iconSize = 22,
  mobileIconSize = 19,
  label,
  children,
}: {
  icon: string;
  iconBg: string;
  iconSize?: number;
  mobileIconSize?: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[132px] flex-col gap-2.5 rounded-18 border border-line bg-surface p-4 shadow-card lg:min-w-0 lg:gap-[14px] lg:rounded-card lg:p-6">
      <span
        className="flex h-[34px] w-[34px] items-center justify-center rounded-11 lg:h-10 lg:w-10 lg:rounded-12"
        style={{ background: iconBg }}
      >
        <Icon name={icon} size={mobileIconSize} className="lg:hidden" />
        <Icon name={icon} size={iconSize} className="hidden lg:block" />
      </span>
      <div className="flex flex-col gap-0.5 lg:gap-1">
        <span className="text-115 font-medium text-ink3 lg:text-125">{label}</span>
        <span className="font-rounded text-22 font-bold text-ink lg:text-26">
          {children}
        </span>
      </div>
    </div>
  );
}

/** 数値の後ろに付く単位（本 / 時間 / 分 / コース / 日） */
export function StatUnit({
  children,
  both = false,
}: {
  children: React.ReactNode;
  both?: boolean;
}) {
  return (
    <span
      className={`text-12 font-medium text-ink3 lg:text-14 ${
        both ? "mx-[3px] lg:mx-1" : "ml-[3px] lg:ml-1"
      }`}
    >
      {children}
    </span>
  );
}
