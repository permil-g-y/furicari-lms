/**
 * Phase 1 のダミー教材（src/lib/mock）から Supabase の Seed SQL を生成する。
 *
 *   npx --yes tsx scripts/generate-content-seed.ts
 *
 * 出力: supabase/seed/0001_content.sql
 *
 * 手で SQL を書かず mock から変換することで、Phase 1 の UI に出ている内容と
 * DB の内容が必ず一致する。生成物は冪等（slug で upsert）なので何度流してもよい。
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { allChapters, allLessons, courseLongDescription, courses } from "../src/lib/mock/courses";
import { categories, tools, toolFilterOrder } from "../src/lib/mock/taxonomy";
import type { Level } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "supabase", "seed", "0001_content.sql");

/** SQL リテラルへのエスケープ */
function q(value: string | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function json(value: unknown): string {
  return `${q(JSON.stringify(value))}::jsonb`;
}

function level(value: Level): string {
  return `'${value}'::public.content_level`;
}

/** slug から id を引く副問い合わせ（uuid を seed に直書きしないため） */
const courseId = (slug: string) => `(select id from public.courses where slug = ${q(slug)})`;
const chapterId = (slug: string) => `(select id from public.chapters where slug = ${q(slug)})`;
const categoryId = (slug: string) =>
  slug === "all" ? "null" : `(select id from public.categories where slug = ${q(slug)})`;
const toolId = (slug: string) => `(select id from public.tools where slug = ${q(slug)})`;

const lines: string[] = [];

lines.push(`-- ---------------------------------------------------------------------------
-- フリキャリ 教材シードデータ
--
-- !! このファイルは自動生成です。直接編集しないでください。!!
-- 生成元 : src/lib/mock/{courses,taxonomy}.ts
-- 生成方法: npx --yes tsx scripts/generate-content-seed.ts
--
-- slug を一意キーにした upsert なので、何度実行しても同じ状態になります。
-- 既存レコードの手編集（管理画面での変更など）を上書きする点に注意。
-- ---------------------------------------------------------------------------

begin;
`);

/* ---------------------------------------------------------------- categories */
lines.push(`-- categories -----------------------------------------------------------------`);
lines.push(`insert into public.categories (slug, label, sort_order) values`);
lines.push(
  categories
    .filter((c) => c.key !== "all") // "すべて" は UI 上の仮想値なので DB には入れない
    .map((c, i) => `  (${q(c.key)}, ${q(c.label)}, ${i + 1})`)
    .join(",\n") +
    `\non conflict (slug) do update set label = excluded.label, sort_order = excluded.sort_order;\n`,
);

/* --------------------------------------------------------------------- tools */
lines.push(`-- tools ----------------------------------------------------------------------`);
lines.push(
  `insert into public.tools (slug, name, badge, gradient_from, gradient_to, ink, sort_order) values`,
);
lines.push(
  toolFilterOrder
    .map((key, i) => {
      const t = tools[key];
      return `  (${q(t.key)}, ${q(t.name)}, ${q(t.badge)}, ${q(t.gradientFrom)}, ${q(t.gradientTo)}, ${q(t.ink)}, ${i + 1})`;
    })
    .join(",\n") +
    `\non conflict (slug) do update set
  name = excluded.name, badge = excluded.badge,
  gradient_from = excluded.gradient_from, gradient_to = excluded.gradient_to,
  ink = excluded.ink, sort_order = excluded.sort_order;\n`,
);

/* ------------------------------------------------------------------- courses */
lines.push(`-- courses --------------------------------------------------------------------`);
for (const course of courses) {
  lines.push(`insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  ${q(course.id)},
  ${q(course.title)},
  ${q(course.description)},
  ${q(courseLongDescription[course.id] ?? null)},
  ${categoryId(course.category)},
  ${level(course.level)},
  ${q(course.cover.bg)},
  ${q(course.cover.icon ?? null)},
  ${q(course.cover.text ?? null)},
  ${q(course.cover.textColor ?? null)},
  ${q(course.durationLabel)},
  ${json(course.learnPoints ?? [])},
  true,
  ${course.sortOrder}
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;
`);
}

/* ------------------------------------------------------------------ chapters */
lines.push(`-- chapters -------------------------------------------------------------------`);
for (const chapter of allChapters) {
  lines.push(`insert into public.chapters (course_id, slug, number, title, sort_order) values (
  ${courseId(chapter.courseId)}, ${q(chapter.id)}, ${chapter.number}, ${q(chapter.title)}, ${chapter.sortOrder}
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;
`);
}

/* ------------------------------------------------------------------- lessons */
lines.push(`-- lessons --------------------------------------------------------------------`);
for (const lesson of allLessons) {
  lines.push(`insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  ${q(lesson.id)},
  ${courseId(lesson.courseId)},
  ${chapterId(lesson.chapterId)},
  ${lesson.number},
  ${q(lesson.title)},
  ${q(lesson.description ?? null)},
  ${json(lesson.keyPoints ?? [])},
  null,
  ${lesson.durationSeconds},
  ${toolId(lesson.tool)},
  ${categoryId(lesson.category)},
  ${level(lesson.level)},
  true,
  ${q(lesson.publishedAt)}::timestamptz,
  ${lesson.sortOrder}
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;
`);
}

lines.push(`commit;`);
lines.push(``);
lines.push(`-- 生成サマリ: categories ${categories.length - 1} / tools ${toolFilterOrder.length} / courses ${courses.length} / chapters ${allChapters.length} / lessons ${allLessons.length}`);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"), "utf8");

console.log(`generated: ${outPath}`);
console.log(
  `  categories=${categories.length - 1} tools=${toolFilterOrder.length} courses=${courses.length} chapters=${allChapters.length} lessons=${allLessons.length}`,
);
