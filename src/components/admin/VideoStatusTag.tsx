import { Tag } from "@/components/ui/Tag";
import { bucketLabel, type VideoBucket } from "@/lib/admin/lessons";

/**
 * 動画の状態バッジ。
 * 「動画未設定」と「同期失敗」を同じ見た目にしない（運営の次の行動が違うため）。
 */
export function VideoStatusTag({ bucket }: { bucket: VideoBucket }) {
  const label = bucketLabel[bucket];

  if (bucket === "failed") {
    return (
      <span
        className="inline-flex h-6 items-center whitespace-nowrap rounded-full border border-danger-line bg-pink-bg text-115 font-bold text-danger"
        style={{ paddingInline: 9 }}
      >
        {label}
      </span>
    );
  }
  if (bucket === "ready") return <Tag tone="success">{label}</Tag>;
  if (bucket === "processing") return <Tag tone="brand">{label}</Tag>;
  if (bucket === "unsynced") return <Tag tone="default">{label}</Tag>;
  return <Tag tone="muted">{label}</Tag>;
}
