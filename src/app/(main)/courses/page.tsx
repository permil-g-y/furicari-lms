"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { CourseCardMobile, CourseCardPc } from "@/components/course/CourseCard";
import { CategoryChips } from "@/components/ui/Filters";
import { categories, courses } from "@/lib/mock";
import type { CategoryKey } from "@/lib/types";

/**
 * コース一覧
 * PC: ページヘッダー（1fr 220px）→ カテゴリフィルター → 3 カラムのカードグリッド
 * Mobile: カテゴリチップの横スクロール帯 → リード文 → カード 1 カラム
 */
export default function CoursesPage() {
  const [category, setCategory] = useState<CategoryKey>("all");

  const filtered = useMemo(
    () =>
      category === "all"
        ? courses
        : courses.filter((course) => course.category === category),
    [category],
  );

  return (
    <>
      {/* ---------------- Mobile ---------------- */}
      <div className="lg:hidden">
        <div className="border-b border-[#E9F0FA] bg-page pb-2.5 pt-3">
          <div className="mx-auto w-full max-w-[560px]">
            <CategoryChips
              items={categories}
              value={category}
              onChange={setCategory}
              height={36}
              fontSize={13}
              scrollOnMobile
              className="px-4 [&>button.bg-brand]:font-bold"
            />
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[560px] flex-col gap-3.5 px-4 pt-4">
          <p className="mb-0.5 text-125 leading-[1.7] text-ink3">
            目的やスキルに合わせて、学びたいコースを選びましょう。
            <span className="text-ink4">（全{filtered.length}コース）</span>
          </p>

          {filtered.map((course) => (
            <CourseCardMobile key={course.id} course={course} />
          ))}
        </main>
      </div>

      {/* ---------------- PC ---------------- */}
      <main className="mx-auto hidden max-w-page flex-col gap-9 px-10 pb-20 pt-11 lg:flex">
        <section className="grid grid-cols-[1fr_220px] items-center gap-8">
          <div className="flex flex-col gap-2.5">
            <h1 className="font-rounded text-28 font-bold text-ink">コース</h1>
            <p className="text-pretty text-15 leading-[1.8] text-ink-sub2">
              目的やスキルに合わせて、学びたいコースを選びましょう。
              <br />
              学習中のコースは進捗が表示されます。
            </p>
          </div>
          <div className="flex justify-end">
            <img
              src="/illust/illust-girl-soft.png"
              alt=""
              className="block h-auto w-[220px]"
            />
          </div>
        </section>

        <section className="flex items-center gap-2.5">
          <CategoryChips
            items={categories}
            value={category}
            onChange={setCategory}
            height={40}
            fontSize={14}
            className="min-w-0 flex-1 [&>button.bg-brand]:font-bold [&>button]:px-5"
          />
          <span className="shrink-0 text-13 text-ink3">
            全{filtered.length}コース
          </span>
        </section>

        <section className="grid grid-cols-3 gap-6">
          {filtered.map((course) => (
            <CourseCardPc key={course.id} course={course} />
          ))}
        </section>
      </main>
    </>
  );
}
