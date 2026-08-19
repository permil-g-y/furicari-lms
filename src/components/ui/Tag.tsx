import type { CourseStatus, LessonStatus } from "@/lib/types";

/**
 * タグ / バッジ。Claude Design 上は高さ 22〜28px・padding 0 7〜12px・
 * font-size 11.5px・角丸ピルで統一されている。
 */
export type TagTone =
  | "default" // #F4F8FF 面 / #5B6B85 文字
  | "brand" // #EAF4FF 面 / #2C7BE0 文字
  | "white" // 白面 + #E6EEFA 枠
  | "solid" // #3B90F5 塗り / 白文字
  | "success" // #E9F7F1 面 / #2E9367 文字
  | "muted"; // 白面 + 枠 / #9BB1CC 文字

const toneClass: Record<TagTone, string> = {
  default: "bg-page text-ink2",
  brand: "bg-brand-tint text-brand-deep font-medium",
  white: "bg-surface border border-line text-ink3",
  solid: "bg-brand text-white font-bold",
  success: "bg-success-bg text-success font-bold",
  muted: "bg-surface border border-line text-ink4 font-bold",
};

export function Tag({
  tone = "default",
  height = 24,
  paddingX = 9,
  fontSize = 11.5,
  className = "",
  children,
}: {
  tone?: TagTone;
  height?: number;
  paddingX?: number;
  fontSize?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap ${toneClass[tone]} ${className}`}
      style={{ height, paddingInline: paddingX, fontSize }}
    >
      {children}
    </span>
  );
}

/** 動画の視聴状態バッジ */
export function LessonStatusBadge({
  status,
  percent,
  height = 24,
  fontSize = 11.5,
  className = "",
}: {
  status: LessonStatus;
  percent?: number;
  height?: number;
  fontSize?: number;
  className?: string;
}) {
  if (status === "completed") {
    return (
      <Tag tone="success" height={height} fontSize={fontSize} className={className}>
        ✓ 視聴済み
      </Tag>
    );
  }
  if (status === "in_progress") {
    return (
      <Tag tone="solid" height={height} fontSize={fontSize} className={className}>
        視聴中 {percent}%
      </Tag>
    );
  }
  return (
    <Tag tone="muted" height={height} fontSize={fontSize} className={className}>
      未視聴
    </Tag>
  );
}

/**
 * コースの受講状態バッジ
 * Reference（コース一覧）実値: h26 / padding 0 11px / 11.5px / weight700
 * 学習中=#3B90F5塗り、完了=白地+#B8E4CF枠+#2E9367、未開始=白地+#E6EEFA枠+#7C8CA6
 */
export function CourseStatusBadge({
  status,
  height = 26,
  paddingX = 11,
  fontSize = 11.5,
  className = "",
}: {
  status: CourseStatus;
  height?: number;
  paddingX?: number;
  fontSize?: number;
  className?: string;
}) {
  if (status === "in_progress") {
    return (
      <Tag
        tone="solid"
        height={height}
        paddingX={paddingX}
        fontSize={fontSize}
        className={className}
      >
        学習中
      </Tag>
    );
  }
  if (status === "completed") {
    return (
      <span
        className={`inline-flex items-center gap-[5px] rounded-full whitespace-nowrap bg-surface border border-success-line text-success font-bold ${className}`}
        style={{ height, paddingInline: paddingX, fontSize }}
      >
        ✓ 完了
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap bg-surface border border-line text-ink3 font-bold ${className}`}
      style={{ height, paddingInline: paddingX, fontSize }}
    >
      未開始
    </span>
  );
}
