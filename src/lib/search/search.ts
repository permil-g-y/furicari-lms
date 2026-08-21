import type { Chapter, Course, Lesson, Tool, ToolKey, Category } from "@/lib/types";

/**
 * 横断検索。
 *
 * ■ DB を使わない理由
 *   教材（コース 6 / チャプター 25 / レッスン 90）は、すでに 1 リクエストにつき
 *   1 回だけ全件メモリへ載っている。この規模なら ilike も索引も全文検索も要らない。
 *   さらにメモリ検索は**スナップショット自体が RLS を通ってきている**ため、
 *   受講権限を後から入れても自動的に整合する。
 *   件数が数千規模になったら、この純粋関数の中身だけを DB 検索へ差し替える。
 *
 * ■ チャプターを単独の検索結果に出さない理由
 *   チャプターだけ出しても遷移先が「コース詳細のアコーディオンの途中」で中途半端になる。
 *   そのかわりチャプター名をレッスンの検索対象に含めるので、
 *   「テロップ」で検索すると Chapter 4「テロップ・字幕」配下のレッスンが出る。
 */

/** 検索に必要な教材データ。ContentApi が構造的に満たすのでそのまま渡せる */
export type SearchContent = {
  courses: Course[];
  allChapters: Chapter[];
  allLessons: Lesson[];
  categories: Category[];
  tools: Record<ToolKey, Tool>;
};

export type SearchResult = {
  courses: Course[];
  lessons: Lesson[];
  /** 検索語（空白区切りで AND 検索する） */
  terms: string[];
  total: number;
};

/** 全角スペースも区切りとして扱い、空要素を落とす */
export function parseQuery(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/[\s　]+/)
    .filter(Boolean);
}

/** すべての語を含むか（AND 検索） */
function matchesAll(haystack: string, terms: string[]): boolean {
  const target = haystack.toLowerCase();
  return terms.every((term) => target.includes(term));
}

export function searchContent(content: SearchContent, raw: string): SearchResult {
  const terms = parseQuery(raw);
  if (terms.length === 0) {
    return { courses: [], lessons: [], terms, total: 0 };
  }

  const categoryLabel = (key: string) =>
    content.categories.find((c) => c.key === key)?.label ?? "";

  const courseById = new Map(content.courses.map((c) => [c.id, c]));
  const chapterById = new Map(content.allChapters.map((c) => [c.id, c]));

  const courses = content.courses.filter((course) =>
    matchesAll(
      [course.title, course.description, categoryLabel(course.category)].join(" "),
      terms,
    ),
  );

  const lessons = content.allLessons.filter((lesson) => {
    const course = courseById.get(lesson.courseId);
    const chapter = chapterById.get(lesson.chapterId);
    const haystack = [
      lesson.title,
      lesson.description ?? "",
      ...(lesson.keyPoints ?? []),
      chapter?.title ?? "",
      course?.title ?? "",
      content.tools[lesson.tool]?.name ?? "",
      categoryLabel(lesson.category),
    ].join(" ");
    return matchesAll(haystack, terms);
  });

  return { courses, lessons, terms, total: courses.length + lessons.length };
}
