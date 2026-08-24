import type { CategoryKey, Level, ToolKey } from "@/lib/types";

/**
 * レッスンの編集と並び替え。
 *
 * ■ 並び替えが「番号の付け直し」を伴う理由
 *   カリキュラムも動画閲覧画面も、レッスンを `number`（01, 02 …）で表示している。
 *   `sort_order` だけ入れ替えると、並びは変わるのに番号が飛んだままになり、
 *   受講生からは「05 の次が 03」に見える。
 *   並び替えたら **コース内で 1 から振り直す**。
 *
 * ここは純粋関数だけ。並び替えでレッスンを取りこぼさないことをテストで固定する。
 */

export type EditableLesson = {
  id: string;
  slug: string;
  courseId: string;
  number: number;
  sortOrder: number;
};

export type LessonFields = {
  title: string;
  description: string;
  keyPoints: string[];
  tool: ToolKey;
  category: CategoryKey;
  level: Level;
};

export type LessonPatch = {
  title: string;
  description: string | null;
  key_points: string[];
  level: Level;
};

/** 編集フォームの内容を保存できる形にする */
export function validateFields(
  fields: LessonFields,
): { ok: true; patch: LessonPatch } | { ok: false; message: string } {
  const title = fields.title.trim();
  if (!title) return { ok: false, message: "タイトルを入力してください。" };

  // 空行は落とす。受講生の「この動画について」に空の箇条書きを出さない
  const keyPoints = fields.keyPoints.map((k) => k.trim()).filter(Boolean);
  const description = fields.description.trim();

  return {
    ok: true,
    patch: {
      title,
      description: description || null,
      key_points: keyPoints,
      level: fields.level,
    },
  };
}

export type ReorderResult = {
  /** 保存すべき並び（コース内の全レッスン）。番号は 1 から振り直してある */
  ordered: { id: string; number: number; sortOrder: number }[];
  /** 実際に位置が変わったか */
  changed: boolean;
};

/**
 * コース内でレッスンを 1 つ上／下へ動かし、番号を振り直す。
 *
 * 端を越えて動かそうとした場合は何もしない（黙って壊さない）。
 */
export function reorderLesson(
  lessons: readonly EditableLesson[],
  lessonId: string,
  direction: -1 | 1,
): ReorderResult {
  const sorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder || a.number - b.number);
  const index = sorted.findIndex((l) => l.id === lessonId);
  const target = index + direction;

  if (index < 0 || target < 0 || target >= sorted.length) {
    return { ordered: renumber(sorted), changed: false };
  }

  [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
  return { ordered: renumber(sorted), changed: true };
}

/** 並びどおりに 1 から振り直す */
function renumber(
  sorted: readonly EditableLesson[],
): { id: string; number: number; sortOrder: number }[] {
  return sorted.map((lesson, i) => ({ id: lesson.id, number: i + 1, sortOrder: i + 1 }));
}

/**
 * 実際に書き込む必要がある行だけを返す。
 *
 * 並び替えは 1 回ごとにコース全体を書き直しうるが、
 * 値が変わっていない行まで更新すると updated_at が無意味に動き、
 * 「何を変えたのか」が後から分からなくなる。
 */
export function changedRows(
  before: readonly EditableLesson[],
  after: readonly { id: string; number: number; sortOrder: number }[],
): { id: string; number: number; sortOrder: number }[] {
  const byId = new Map(before.map((l) => [l.id, l]));
  return after.filter((row) => {
    const original = byId.get(row.id);
    if (!original) return true;
    return original.number !== row.number || original.sortOrder !== row.sortOrder;
  });
}
