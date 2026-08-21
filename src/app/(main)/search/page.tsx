"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { CourseCardMobile, CourseCardPc } from "@/components/course/CourseCard";
import { Icon } from "@/components/ui/Icon";
import { VideoCardGrid, VideoCardList } from "@/components/video/VideoCard";
import { useContent } from "@/lib/content/context";
import { formatDuration } from "@/lib/content/format";
import { searchContent } from "@/lib/search/search";
import type { Lesson } from "@/lib/types";

/**
 * 横断検索の結果ページ。
 *
 * 検索は DB ではなく、すでにメモリへ載っている教材スナップショットに対して行う
 * （理由は src/lib/search/search.ts のコメント）。
 *
 * 表示は既存の CourseCard / VideoCard をそのまま使う。
 * 新しいカードデザインは作らない。
 */

/** 検索語が空のときの案内。空状態の見た目は動画一覧と揃える */
function EmptyState({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface px-6 py-14 shadow-card">
      <span className="font-rounded text-16 font-bold text-ink">{title}</span>
      <span className="text-125 leading-[1.8] text-ink3">{note}</span>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: "icon-book" | "icon-film";
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 lg:gap-2.5">
      <Icon name={icon} size={20} className="lg:hidden" />
      <Icon name={icon} size={24} className="hidden lg:block" />
      <h2 className="font-rounded text-16 font-bold text-ink lg:text-20">{title}</h2>
      <span className="text-125 text-ink4">（{count}件）</span>
    </div>
  );
}

function SearchResults() {
  const content = useContent();
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  const result = useMemo(() => searchContent(content, query), [content, query]);

  /** Mobile のリストカードは「コース名 ・ 12:45」を出す */
  const mobileMeta = (lesson: Lesson) =>
    `${content.getCourse(lesson.courseId)?.title ?? ""} ・ ${formatDuration(
      lesson.durationSeconds,
    )}`;

  const heading = query.trim()
    ? `「${query.trim()}」の検索結果`
    : "検索";

  const body =
    result.terms.length === 0 ? (
      <EmptyState
        title="検索したい言葉を入力してください"
        note="コース名・動画のタイトル・使用ツールなどで探せます。"
      />
    ) : result.total === 0 ? (
      <EmptyState
        title="条件に合う結果が見つかりませんでした"
        note="別の言葉で、もう一度お試しください。"
      />
    ) : (
      <>
        {result.courses.length > 0 && (
          <section className="flex flex-col gap-3 lg:gap-5">
            <SectionHeading icon="icon-book" title="コース" count={result.courses.length} />
            <div className="flex flex-col gap-3 lg:hidden">
              {result.courses.map((course) => (
                <CourseCardMobile key={course.id} course={course} />
              ))}
            </div>
            <div className="hidden grid-cols-3 gap-6 lg:grid">
              {result.courses.map((course) => (
                <CourseCardPc key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {result.lessons.length > 0 && (
          <section className="flex flex-col gap-3 lg:gap-5">
            <SectionHeading icon="icon-film" title="動画" count={result.lessons.length} />
            <div className="flex flex-col gap-3.5 lg:hidden">
              {result.lessons.map((lesson) => (
                <VideoCardList key={lesson.id} lesson={lesson} metaLine={mobileMeta(lesson)} />
              ))}
            </div>
            <div className="hidden grid-cols-3 gap-6 lg:grid">
              {result.lessons.map((lesson) => (
                <VideoCardGrid key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        )}
      </>
    );

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 pb-[120px] pt-5 lg:gap-10 lg:px-10 lg:pb-20 lg:pt-11">
      <div className="flex flex-col gap-2 lg:gap-2.5">
        <h1 className="font-rounded text-19 font-bold text-ink lg:text-28">{heading}</h1>
        {result.terms.length > 0 && (
          <p className="text-125 leading-[1.8] text-ink-sub2 lg:text-15">
            コースと動画から {result.total} 件見つかりました。
          </p>
        )}
      </div>

      {body}
    </main>
  );
}

export default function SearchPage() {
  // useSearchParams は Suspense の内側で使う必要がある
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
