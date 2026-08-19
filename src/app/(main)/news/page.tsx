"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryChips, Pagination } from "@/components/ui/Filters";
import { Icon } from "@/components/ui/Icon";
import {
  announcementCategoryLabel,
  announcementCategoryStyle,
  announcements,
} from "@/lib/mock";
import type { AnnouncementCategory } from "@/lib/types";

type FilterKey = "all" | AnnouncementCategory;

/** Claude Design のチップ並び（すべて / 新着コース / イベント / アップデート / メンテナンス） */
const filterItems: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "new_course", label: announcementCategoryLabel.new_course },
  { key: "event", label: announcementCategoryLabel.event },
  { key: "update", label: announcementCategoryLabel.update },
  { key: "maintenance", label: announcementCategoryLabel.maintenance },
];

const PAGE_SIZE = 8;

/** カテゴリバッジ（配色は announcementCategoryStyle の実値） */
function CategoryBadge({
  category,
  size = "pc",
}: {
  category: AnnouncementCategory;
  size?: "pc" | "mobile";
}) {
  const tone = announcementCategoryStyle[category];
  const pc = size === "pc";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        height: pc ? 24 : 22,
        width: pc ? 86 : undefined,
        paddingInline: pc ? 10 : 8,
        fontSize: pc ? 11.5 : 11,
        background: tone.bg,
        color: tone.color,
        border: tone.border ? `1px solid ${tone.border}` : undefined,
      }}
    >
      {announcementCategoryLabel[category]}
    </span>
  );
}

function NewBadge({ size = "pc" }: { size?: "pc" | "mobile" }) {
  const pc = size === "pc";
  return (
    <span
      className="flex shrink-0 items-center rounded-6 bg-alert font-bold tracking-[.06em] text-white"
      style={{
        height: pc ? 22 : 20,
        paddingInline: pc ? 8 : 7,
        fontSize: pc ? 10.5 : 10,
      }}
    >
      NEW
    </span>
  );
}

export default function NewsPage() {
  const [category, setCategory] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      category === "all"
        ? announcements
        : announcements.filter((a) => a.category === category),
    [category],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function changeCategory(key: FilterKey) {
    setCategory(key);
    setPage(1);
  }

  return (
    <>
      {/* ------------------------------------------------------------ Mobile */}
      <div className="lg:hidden">
        <div className="border-b border-[#E9F0FA] bg-page pt-3 pb-2.5">
          <div className="px-4">
            <CategoryChips
              items={filterItems}
              value={category}
              onChange={changeCategory}
              height={36}
              fontSize={13}
              scrollOnMobile
            />
          </div>
        </div>

        <main className="flex flex-col gap-2.5 px-4 pt-4">
          <p className="text-125 leading-[1.7] text-ink3">
            新しいコースの追加や、サービスのアップデート情報をお届けします。
            <span className="text-ink4">（全{filtered.length}件）</span>
          </p>

          {visible.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="flex flex-col gap-2 rounded-18 border border-line bg-surface p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={item.category} size="mobile" />
                {item.isNew && <NewBadge size="mobile" />}
                <span className="text-115 text-ink4">{item.date}</span>
              </div>
              <span className="text-135 leading-[1.5] font-medium text-ink">
                {item.title}
              </span>
            </Link>
          ))}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            className="pt-2"
          />
        </main>
      </div>

      {/* ---------------------------------------------------------------- PC */}
      <main className="mx-auto hidden max-w-page flex-col gap-8 px-10 pt-11 pb-20 lg:flex">
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <Icon name="icon-chat" size={26} />
            <h1 className="font-rounded text-28 font-bold text-ink">お知らせ</h1>
          </div>
          <p className="text-15 leading-[1.8] text-ink-sub2">
            新しいコースの追加や、サービスのアップデート情報をお届けします。
          </p>
        </section>

        <section className="flex flex-wrap items-center gap-2.5">
          <CategoryChips
            items={filterItems}
            value={category}
            onChange={changeCategory}
            height={38}
            fontSize={13.5}
          />
          <span className="ml-auto text-13 text-ink3">全{filtered.length}件</span>
        </section>

        <section className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {visible.map((item, i) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className={`flex items-center gap-[14px] px-6 py-5 transition-colors hover:bg-surface-subtle ${
                i ? "border-t border-surface-alt" : ""
              }`}
            >
              <span className="w-[92px] shrink-0 text-125 text-ink4">
                {item.date}
              </span>
              <CategoryBadge category={item.category} />
              {item.isNew && <NewBadge />}
              <span className="min-w-0 flex-1 text-145 leading-[1.6] font-medium text-ink">
                {item.title}
              </span>
              <span className="shrink-0 text-125 font-bold text-brand-deep">
                詳細を見る 〉
              </span>
            </Link>
          ))}
        </section>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
          className="pt-1"
        />
      </main>
    </>
  );
}
