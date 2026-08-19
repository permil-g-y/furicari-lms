import { courses, getCourse, getLessonStatus, tools } from "@/lib/mock";
import type { CategoryKey, Lesson, Level, ToolKey } from "@/lib/types";

/* =========================================================================
   動画一覧の絞り込み / 並び替えロジック
   （PC の左サイドバーと Mobile のボトムシートで同じ state を共有する）
   ========================================================================= */

/** 視聴状況フィルター */
export type WatchFilter = "all" | "not_started" | "in_progress" | "completed";

/** 並び替え */
export type SortKey = "recommended" | "new" | "order" | "short";

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "おすすめ" },
  { key: "new", label: "新着順" },
  { key: "order", label: "学習順" },
  { key: "short", label: "動画時間が短い順" },
];

export const watchFilterOptions: { key: WatchFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "not_started", label: "未視聴" },
  { key: "in_progress", label: "視聴中" },
  { key: "completed", label: "視聴済み" },
];

export type VideoFilterState = {
  category: CategoryKey;
  /** 使用ツール（複数選択） */
  toolKeys: ToolKey[];
  /** 難易度（未選択は null） */
  level: Level | null;
  watch: WatchFilter;
  keyword: string;
};

export const emptyVideoFilter: VideoFilterState = {
  category: "all",
  toolKeys: [],
  level: null,
  watch: "all",
  keyword: "",
};

/** 1 つでも絞り込みが効いているか（Mobile のフィルターボタンのドット表示に使う） */
export function hasActiveFilter(filter: VideoFilterState): boolean {
  return (
    filter.category !== "all" ||
    filter.toolKeys.length > 0 ||
    filter.level !== null ||
    filter.watch !== "all"
  );
}

export function toggleTool(toolKeys: ToolKey[], key: ToolKey): ToolKey[] {
  return toolKeys.includes(key)
    ? toolKeys.filter((k) => k !== key)
    : [...toolKeys, key];
}

export function filterLessons(base: Lesson[], filter: VideoFilterState): Lesson[] {
  const keyword = filter.keyword.trim().toLowerCase();

  return base.filter((lesson) => {
    if (filter.category !== "all" && lesson.category !== filter.category) return false;
    if (filter.toolKeys.length > 0 && !filter.toolKeys.includes(lesson.tool)) return false;
    if (filter.level !== null && lesson.level !== filter.level) return false;
    if (filter.watch !== "all" && getLessonStatus(lesson.id) !== filter.watch) return false;

    if (keyword) {
      const course = getCourse(lesson.courseId);
      const haystack = [
        lesson.title,
        lesson.description ?? "",
        course?.title ?? "",
        tools[lesson.tool].name,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
}

export function sortLessons(list: Lesson[], sort: SortKey): Lesson[] {
  if (sort === "recommended") return list;

  const courseOrder = new Map(courses.map((c) => [c.id, c.sortOrder]));
  const indexed = list.map((lesson, index) => ({ lesson, index }));

  if (sort === "new") {
    indexed.sort((a, b) => {
      if (a.lesson.publishedAt !== b.lesson.publishedAt) {
        return a.lesson.publishedAt < b.lesson.publishedAt ? 1 : -1;
      }
      return a.index - b.index;
    });
  } else if (sort === "order") {
    indexed.sort((a, b) => {
      const diff =
        (courseOrder.get(a.lesson.courseId) ?? 0) - (courseOrder.get(b.lesson.courseId) ?? 0);
      if (diff !== 0) return diff;
      return a.lesson.sortOrder - b.lesson.sortOrder;
    });
  } else {
    indexed.sort((a, b) => {
      const diff = a.lesson.durationSeconds - b.lesson.durationSeconds;
      return diff !== 0 ? diff : a.index - b.index;
    });
  }

  return indexed.map((i) => i.lesson);
}
