import type { Category, Level, Tool, ToolKey, CategoryKey } from "@/lib/types";

/** 全ページ共通のカテゴリ 6 分類 */
export const categories: Category[] = [
  { key: "all", label: "すべて" },
  { key: "video-editing", label: "動画編集" },
  { key: "ai", label: "AI活用" },
  { key: "client-acquisition", label: "案件獲得" },
  { key: "sales", label: "営業" },
  { key: "client-work", label: "クライアントワーク" },
];

export function categoryLabel(key: CategoryKey): string {
  return categories.find((c) => c.key === key)?.label ?? "";
}

/**
 * ツール定義。グラデーションは Claude Design のサムネイル仕様そのまま。
 * （動画一覧・TOP の renderVals 内で定義されていた値）
 */
export const tools: Record<ToolKey, Tool> = {
  premiere: {
    key: "premiere",
    name: "Premiere Pro",
    badge: "Pr",
    gradientFrom: "#2E5FA8",
    gradientTo: "#1E3A6B",
    ink: "#2C7BE0",
  },
  aftereffects: {
    key: "aftereffects",
    name: "After Effects",
    badge: "Ae",
    gradientFrom: "#4A4E8C",
    gradientTo: "#2A2C55",
    ink: "#4A4E8C",
  },
  capcut: {
    key: "capcut",
    name: "CapCut",
    badge: "CapCut",
    gradientFrom: "#2BA79A",
    gradientTo: "#12756E",
    ink: "#12756E",
  },
  davinci: {
    key: "davinci",
    name: "DaVinci Resolve",
    badge: "DaVinci",
    gradientFrom: "#5B6B85",
    gradientTo: "#2E3A4E",
    ink: "#3D4C66",
  },
  chatgpt: {
    key: "chatgpt",
    name: "ChatGPT",
    badge: "ChatGPT",
    gradientFrom: "#6EC6FF",
    gradientTo: "#2C7BE0",
    ink: "#2C7BE0",
  },
  claude: {
    key: "claude",
    name: "Claude",
    badge: "Claude",
    gradientFrom: "#FFB0BF",
    gradientTo: "#F1748E",
    ink: "#D45570",
  },
};

/** 動画一覧の「使用ツール」フィルターの並び */
export const toolFilterOrder: ToolKey[] = [
  "premiere",
  "aftereffects",
  "capcut",
  "davinci",
  "chatgpt",
  "claude",
];

/** コンテンツのタグに出る表記（初心者向け / 中級者向け / 上級者向け） */
export function levelLabel(level: Level): string {
  return { beginner: "初心者向け", intermediate: "中級者向け", advanced: "上級者向け" }[level];
}

/** 絞り込みフィルターに出る短い表記（初心者 / 中級 / 上級） */
export function levelFilterLabel(level: Level): string {
  return { beginner: "初心者", intermediate: "中級", advanced: "上級" }[level];
}

export const levelFilterOrder: Level[] = ["beginner", "intermediate", "advanced"];

/** 秒 → "12:45" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 通し番号 → "05" */
export function formatLessonNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/** 分秒指定を秒へ（データ定義を読みやすくするためのヘルパー） */
export function ms(minutes: number, seconds: number): number {
  return minutes * 60 + seconds;
}
