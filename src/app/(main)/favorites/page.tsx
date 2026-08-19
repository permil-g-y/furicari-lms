"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CategoryChips, SearchBox, SortSelect } from "@/components/ui/Filters";
import { VideoCardGrid, VideoCardList } from "@/components/video/VideoCard";
import { useFavorites } from "@/lib/favorites-context";
import { useContent } from "@/lib/content/context";
import type { CategoryKey, Lesson } from "@/lib/types";

/** 並び替えは Claude Design 上「保存日が新しい順」の 1 種類のみ */
const sortOptions = [{ key: "recent" as const, label: "保存日が新しい順" }];

export default function FavoritesPage() {
  const content = useContent();
  const categories = content.categories;
  const { lessonIds } = useFavorites();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<"recent">("recent");

  /** PC カードの「コース名 ・ Chapter n」行と同じ内容を Mobile のメタ行にも出す */
  const courseLine = (lesson: Lesson): string => {
    const course = content.getCourse(lesson.courseId);
    const chapter = content.getChapter(lesson.chapterId);
    if (!course) return "";
    return `${course.title}${chapter ? ` ・ Chapter ${chapter.number}` : ""}`;
  };

  /**
   * Claude Design の並び順（favoriteLessonIds）を保ちつつ、
   * ハートを外した動画はリストから消し、他ページで追加された動画は末尾に足す。
   */
  const favorites = useMemo<Lesson[]>(() => {
    const base = content
      .getFavoriteLessons()
      .filter((l) => lessonIds.includes(l.id));
    const baseIds = new Set(base.map((l) => l.id));
    const added = content.getLessons(
      lessonIds.filter((id) => !baseIds.has(id)),
    );
    return [...base, ...added];
  }, [content, lessonIds]);

  const lessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return favorites.filter((lesson) => {
      if (category !== "all" && lesson.category !== category) return false;
      if (!q) return true;
      const course = content.getCourse(lesson.courseId);
      return [lesson.title, lesson.description ?? "", course?.title ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [content, favorites, category, query]);

  const isFiltered = query.trim() !== "" || category !== "all";

  const empty = (
    <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      <p className="text-135 leading-[1.8] text-ink3">
        {isFiltered
          ? "条件に合うお気に入りは見つかりませんでした。"
          : "お気に入りに登録した動画はまだありません。"}
      </p>
      <Button variant="outline" size={44} href="/videos">
        動画一覧から探す
      </Button>
    </div>
  );

  const countLabel = (
    <>
      <span className="font-rounded text-17 font-bold text-ink">
        {lessons.length}
      </span>{" "}
      件保存中
    </>
  );

  return (
    <>
      {/* ============================ Mobile ============================ */}
      {/* Claude Design に Mobile 版が無いため、「動画一覧 - Mobile」の
          検索行 → カテゴリチップ帯 → 件数行 → 縦リスト の構造へ変換する。
          ページヘッダーのイラストは「コース一覧 - Mobile」と同じ扱いで省略。 */}
      <div className="lg:hidden">
        <div className="flex flex-col gap-2.5 border-b border-line bg-page pb-2.5 pt-3">
          <div className="px-4">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="お気に入りの中から検索"
              height={44}
              fontSize={13.5}
            />
          </div>
          <CategoryChips
            items={categories}
            value={category}
            onChange={setCategory}
            height={34}
            fontSize={12.5}
            scrollOnMobile
            className="px-4"
          />
        </div>

        <main className="flex flex-col gap-3.5 px-4 pt-3.5">
          <div className="flex items-center gap-2">
            <span className="text-125 text-ink2">{countLabel}</span>
            <span className="ml-auto flex h-8 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3">
              <span className="text-125 font-bold leading-none text-ink-sub">
                保存日が新しい順
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
            </span>
          </div>

          {lessons.length === 0
            ? empty
            : lessons.map((lesson) => (
                <VideoCardList
                  key={lesson.id}
                  lesson={lesson}
                  metaLine={courseLine(lesson)}
                />
              ))}
        </main>
      </div>

      {/* ============================== PC ============================== */}
      <div className="hidden lg:block">
        <main className="mx-auto flex max-w-page flex-col gap-8 px-10 pb-20 pt-11">
          <section
            className="grid items-center gap-8"
            style={{ gridTemplateColumns: "1fr 200px" }}
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <Icon name="icon-heart" size={26} />
                <h1 className="font-rounded text-28 font-bold text-ink">
                  お気に入り
                </h1>
              </div>
              <p className="text-15 leading-[1.8] text-ink-sub2">
                あとで見たい動画や、繰り返し復習したい動画をまとめています。
              </p>
            </div>
            <div className="flex justify-end">
              <img
                src="/illust/illust-girl-soft.png"
                alt=""
                className="block h-auto"
                style={{ width: 200 }}
              />
            </div>
          </section>

          <section className="flex flex-col gap-[18px]">
            <div className="flex items-center gap-3.5">
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="お気に入りの中から検索"
                height={52}
                className="flex-1"
              />
              <SortSelect
                value={sort}
                onChange={setSort}
                options={sortOptions}
                height={52}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <CategoryChips
                items={categories}
                value={category}
                onChange={setCategory}
                height={38}
                fontSize={13.5}
              />
              <span className="ml-auto shrink-0 text-135 text-ink2">
                {countLabel}
              </span>
            </div>
          </section>

          {lessons.length === 0 ? (
            empty
          ) : (
            <section className="grid grid-cols-3 gap-6">
              {lessons.map((lesson) => (
                <VideoCardGrid key={lesson.id} lesson={lesson} showCourseLine />
              ))}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
