import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/**
 * 進捗バー。Claude Design では高さが 4 / 5 / 8 / 10 / 12px の 5 種類、
 * 進行中は青グラデ、完了は緑グラデで塗られる。
 */
export function ProgressBar({
  percent,
  height = 8,
  variant = "auto",
  trackColor = "#EEF3FA",
  className = "",
}: {
  percent: number;
  height?: number;
  /** auto = 100% のとき緑、それ以外は青 */
  variant?: "auto" | "brand" | "success";
  trackColor?: string;
  className?: string;
}) {
  const isSuccess =
    variant === "success" || (variant === "auto" && percent >= 100);
  const fill = isSuccess
    ? "linear-gradient(90deg,#6FD3AC,#2E9367)"
    : "linear-gradient(90deg,#6EC6FF,#3B90F5)";

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{ height, background: trackColor }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: fill }}
      />
    </div>
  );
}

/**
 * サムネイル下端に重ねる視聴進捗バー（オーバーレイ）
 */
export function ThumbnailProgress({
  percent,
  completed = false,
  height = 5,
}: {
  percent: number;
  completed?: boolean;
  height?: number;
}) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 bg-white/25"
      style={{ height }}
    >
      <div
        className="h-full"
        style={{
          width: `${percent}%`,
          background: completed ? "#2E9367" : "#3B90F5",
        }}
      />
    </div>
  );
}

/**
 * セクション見出し（アイコン + タイトル + 右のリンク）
 */
export function SectionHeading({
  icon,
  title,
  note,
  action,
  fontSize = 20,
  iconSize = 24,
  className = "",
}: {
  icon?: IconName | string;
  title: string;
  note?: string;
  action?: { label: string; href: string };
  fontSize?: number;
  iconSize?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {icon && <Icon name={icon} size={iconSize} />}
      <h2
        className="font-rounded font-bold text-ink"
        style={{ fontSize }}
      >
        {title}
      </h2>
      {note && (
        <span className="text-125 text-ink3" style={{ marginLeft: 2 }}>
          {note}
        </span>
      )}
      {action && (
        <Link
          href={action.href}
          className="ml-auto text-135 font-medium text-brand-deep hover:text-brand-deeper"
        >
          {action.label} 〉
        </Link>
      )}
    </div>
  );
}
