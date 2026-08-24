import { Tag } from "@/components/ui/Tag";
import type { StatusTone } from "@/lib/admin/format";

/**
 * 受講状態のバッジ。
 * 既存の Tag をそのまま使い、管理画面用に新しい見た目を増やさない。
 */
const toneMap: Record<StatusTone, "success" | "muted" | "default"> = {
  ok: "success",
  warn: "default",
  muted: "muted",
};

export function StudentStatusTag({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  if (tone === "warn") {
    // 「要対応」だけは既存トークンの警告色で目立たせる
    return (
      <span className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-danger-line bg-pink-bg text-115 font-bold text-danger" style={{ paddingInline: 9 }}>
        {label}
      </span>
    );
  }
  return <Tag tone={toneMap[tone]}>{label}</Tag>;
}
