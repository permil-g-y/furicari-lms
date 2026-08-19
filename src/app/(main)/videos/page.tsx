"use client";

import { useMemo, useState } from "react";
import { CategoryChips, Pagination, SearchBox, SortSelect } from "@/components/ui/Filters";
import { VideoCardGrid, VideoCardList } from "@/components/video/VideoCard";
import { VideoFilterSheet } from "@/components/video/VideoFilterSheet";
import { VideoFilterSidebar } from "@/components/video/VideoFilterSidebar";
import {
  emptyVideoFilter,
  filterLessons,
  hasActiveFilter,
  sortLessons,
  sortOptions,
  toggleTool,
  watchFilterOptions,
  type SortKey,
  type VideoFilterState,
} from "@/components/video/videoFilters";
import {
  categories,
  categoryLabel,
  getAllLessonsInListOrder,
  getChapter,
  getCourse,
  levelFilterLabel,
  tools,
} from "@/lib/mock";
import type { CategoryKey, Lesson } from "@/lib/types";

const PER_PAGE = 9;

/** 適用中フィルタータグ（クリックで解除） */
type AppliedTag = { key: string; label: string; clear: () => void };

export default function VideosPage() {
  const [filter, setFilter] = useState<VideoFilterState>(emptyVideoFilter);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const base = useMemo(() => getAllLessonsInListOrder(), []);
  const results = useMemo(
    () => sortLessons(filterLessons(base, filter), sort),
    [base, filter, sort],
  );

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const update = (patch: Partial<VideoFilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const clearAll = () => {
    setFilter(emptyVideoFilter);
    setPage(1);
  };

  const appliedTags: AppliedTag[] = [];
  if (filter.category !== "all") {
    appliedTags.push({
      key: `cat-${filter.category}`,
      label: categoryLabel(filter.category),
      clear: () => update({ category: "all" }),
    });
  }
  for (const key of filter.toolKeys) {
    appliedTags.push({
      key: `tool-${key}`,
      label: tools[key].name,
      clear: () => update({ toolKeys: toggleTool(filter.toolKeys, key) }),
    });
  }
  if (filter.level) {
    appliedTags.push({
      key: `level-${filter.level}`,
      label: levelFilterLabel(filter.level),
      clear: () => update({ level: null }),
    });
  }
  if (filter.watch !== "all") {
    appliedTags.push({
      key: `watch-${filter.watch}`,
      label: watchFilterOptions.find((o) => o.key === filter.watch)?.label ?? "",
      clear: () => update({ watch: "all" }),
    });
  }

  return (
    <>
      {/* ================= Mobile ================= */}
      <div className="lg:hidden">
        <div className="flex flex-col gap-2.5 border-b border-[#E9F0FA] bg-page pb-2.5 pt-3">
          <div className="flex items-center gap-2.5 px-4">
            <SearchBox
              value={filter.keyword}
              onChange={(keyword) => update({ keyword })}
              placeholder="動画を検索"
              height={44}
              fontSize={13.5}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="絞り込み"
              className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-tint2 bg-surface"
            >
              <span className="flex flex-col items-center gap-[3px]">
                <span className="block h-0.5 w-4 rounded-[2px] bg-brand-deep" />
                <span className="block h-0.5 w-[11px] rounded-[2px] bg-brand-deep" />
                <span className="block h-0.5 w-1.5 rounded-[2px] bg-brand-deep" />
              </span>
              {hasActiveFilter(filter) && (
                <span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full border-2 border-white bg-alert" />
              )}
            </button>
          </div>

          <CategoryChips
            items={categories.map((c) => ({ key: c.key as CategoryKey, label: c.label }))}
            value={filter.category}
            onChange={(category) => update({ category })}
            height={34}
            fontSize={12.5}
            scrollOnMobile
            className="px-4"
          />
        </div>

        <main className="flex flex-col gap-3.5 px-4 pt-3.5">
          <div className="flex items-center gap-2">
            <span className="text-125 text-ink2">
              <span className="font-rounded text-15 font-bold text-ink">{results.length}</span> 件
            </span>
            {appliedTags.slice(0, 1).map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={tag.clear}
                className="flex h-6 shrink-0 cursor-pointer items-center gap-[5px] rounded-full bg-brand-tint px-2.5 text-11 font-medium text-brand-deep"
              >
                {tag.label} <span style={{ color: "#7FB4EE" }}>✕</span>
              </button>
            ))}
            {appliedTags.length > 1 && (
              <span className="shrink-0 text-11 text-ink4">+{appliedTags.length - 1}</span>
            )}

            <MobileSortSelect value={sort} onChange={setSort} />
          </div>

          {pageItems.map((lesson) => (
            <VideoCardList key={lesson.id} lesson={lesson} metaLine={mobileMeta(lesson)} />
          ))}

          {pageItems.length === 0 && <EmptyState />}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            className="pt-1.5"
          />
        </main>

        <VideoFilterSheet
          open={sheetOpen}
          filter={filter}
          resultCount={results.length}
          onChange={update}
          onClear={clearAll}
          onClose={() => setSheetOpen(false)}
        />
      </div>

      {/* ================= PC ================= */}
      <main className="mx-auto hidden max-w-page grid-cols-[260px_1fr] items-start gap-8 px-10 pb-20 pt-11 lg:grid">
        <VideoFilterSidebar filter={filter} onChange={update} onClear={clearAll} />

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-rounded text-28 font-bold text-ink">動画一覧</h1>
            <p className="text-15 leading-[1.8] text-ink-sub2">
              コースをまたいで、学びたい動画を自由に探せます。
            </p>
          </div>

          <div className="flex items-center gap-3.5">
            <SearchBox
              value={filter.keyword}
              onChange={(keyword) => update({ keyword })}
              placeholder="動画タイトル・キーワードで検索"
              height={52}
              className="min-w-0 flex-1 shadow-card"
            />
            <SortSelect
              value={sort}
              onChange={setSort}
              options={sortOptions}
              height={52}
              className="shadow-card"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-135 text-ink2">
              <span className="font-rounded text-17 font-bold text-ink">{results.length}</span>{" "}
              件の動画
            </span>
            {appliedTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={tag.clear}
                className="flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full bg-brand-tint px-2.5 text-115 font-medium text-brand-deep"
              >
                {tag.label} <span style={{ color: "#7FB4EE" }}>✕</span>
              </button>
            ))}
          </div>

          {pageItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {pageItems.map((lesson) => (
                <VideoCardGrid key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            className="pt-3"
          />
        </section>
      </main>
    </>
  );
}

/** Mobile のカードに出すメタ行「動画編集 ・ Premiere Pro 実践コース ・ Chapter 2」 */
function mobileMeta(lesson: Lesson): string {
  const course = getCourse(lesson.courseId);
  const chapter = getChapter(lesson.chapterId);
  return [
    categoryLabel(lesson.category),
    course?.title,
    chapter ? `Chapter ${chapter.number}` : undefined,
  ]
    .filter(Boolean)
    .join(" ・ ");
}

/** Mobile の並び替え（見た目は 32px のピル、中身は select） */
function MobileSortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: SortKey) => void;
}) {
  return (
    <div className="relative ml-auto flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3">
      <span className="whitespace-nowrap text-125 font-bold leading-none text-ink-sub">
        {sortOptions.find((o) => o.key === value)?.label}
      </span>
      <span
        className="block shrink-0"
        style={{
          width: 9,
          height: 9,
          borderRight: "2px solid #7C8CA6",
          borderBottom: "2px solid #7C8CA6",
          transform: "rotate(45deg) translate(-2px,-2px)",
        }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="並び替え"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {sortOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-6 py-14 shadow-card">
      <span className="font-rounded text-16 font-bold text-ink">
        条件に合う動画が見つかりませんでした
      </span>
      <span className="text-125 leading-[1.8] text-ink3">
        絞り込み条件を変えて、もう一度お試しください。
      </span>
    </div>
  );
}
