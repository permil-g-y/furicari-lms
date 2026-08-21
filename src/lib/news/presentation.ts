import type { Announcement } from "@/lib/types";

/**
 * お知らせの見た目に関する定数。
 *
 * データではなく表示の決めごとなので、DB ではなくコードが持つ。
 * 配色は Claude Design の実値をそのまま使っている（新しい色を足さない）。
 */

export const announcementCategoryLabel: Record<Announcement["category"], string> = {
  new_course: "新着コース",
  event: "イベント",
  update: "アップデート",
  maintenance: "メンテナンス",
};

export const announcementCategoryStyle: Record<
  Announcement["category"],
  { bg: string; color: string; border?: string }
> = {
  new_course: { bg: "#EAF4FF", color: "#2C7BE0" },
  event: { bg: "#FFF0F3", color: "#D45570" },
  update: { bg: "#E9F7F1", color: "#2E9367" },
  maintenance: { bg: "#F4F8FF", color: "#5B6B85", border: "#E6EEFA" },
};

/**
 * NEW バッジを出す日数。
 * Phase 1 ではデータに isNew フラグが埋め込まれていたが、
 * 実データ化にあたり published_at からの経過日数で判定する。
 */
export const NEW_WITHIN_DAYS = 7;
