import assert from "node:assert/strict";
import { test } from "node:test";

import {
  changedRows,
  reorderLesson,
  validateFields,
  type EditableLesson,
} from "./lesson-edit";

/**
 * 並び替えで固定したいのは 2 つ。
 *   1. レッスンを取りこぼさないこと
 *   2. 番号が飛ばないこと（受講生には 01,02,03… として見える）
 */

function lessons(count: number): EditableLesson[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `l${i + 1}`,
    slug: `c-0${i + 1}`,
    courseId: "c",
    number: i + 1,
    sortOrder: i + 1,
  }));
}

test("下へ 1 つ動かすと入れ替わり、番号が振り直される", () => {
  const { ordered, changed } = reorderLesson(lessons(3), "l1", 1);
  assert.equal(changed, true);
  assert.deepEqual(ordered, [
    { id: "l2", number: 1, sortOrder: 1 },
    { id: "l1", number: 2, sortOrder: 2 },
    { id: "l3", number: 3, sortOrder: 3 },
  ]);
});

test("上へ 1 つ動かす", () => {
  const { ordered } = reorderLesson(lessons(3), "l3", -1);
  assert.deepEqual(ordered.map((l) => l.id), ["l1", "l3", "l2"]);
});

test("先頭を上へ / 末尾を下へ動かしても壊れない", () => {
  const top = reorderLesson(lessons(3), "l1", -1);
  assert.equal(top.changed, false);
  assert.deepEqual(top.ordered.map((l) => l.id), ["l1", "l2", "l3"]);

  const bottom = reorderLesson(lessons(3), "l3", 1);
  assert.equal(bottom.changed, false);
});

test("知らない ID を渡しても壊れない", () => {
  const { changed, ordered } = reorderLesson(lessons(3), "nope", 1);
  assert.equal(changed, false);
  assert.equal(ordered.length, 3);
});

test("レッスンを取りこぼさない", () => {
  const before = lessons(18);
  const { ordered } = reorderLesson(before, "l10", -1);
  assert.equal(ordered.length, 18);
  assert.equal(new Set(ordered.map((l) => l.id)).size, 18);
});

test("番号が飛んでいた状態でも 1 から振り直す", () => {
  const broken: EditableLesson[] = [
    { id: "a", slug: "a", courseId: "c", number: 3, sortOrder: 1 },
    { id: "b", slug: "b", courseId: "c", number: 7, sortOrder: 2 },
    { id: "c", slug: "c", courseId: "c", number: 12, sortOrder: 3 },
  ];
  const { ordered } = reorderLesson(broken, "a", 1);
  assert.deepEqual(ordered.map((l) => l.number), [1, 2, 3]);
});

test("値が変わった行だけを書き込む", () => {
  const before = lessons(4);
  const { ordered } = reorderLesson(before, "l1", 1);
  const rows = changedRows(before, ordered);
  assert.deepEqual(rows.map((r) => r.id).sort(), ["l1", "l2"], "動いた 2 行だけ");
});

test("並びが変わらなければ書き込む行は無い", () => {
  const before = lessons(4);
  const { ordered } = reorderLesson(before, "l1", -1);
  assert.deepEqual(changedRows(before, ordered), []);
});

/* ---- 編集フォーム ---- */

const fields = {
  title: "  カット編集の基本  ",
  description: "  説明文  ",
  keyPoints: ["  要点1  ", "   ", "要点2"],
  tool: "premiere" as const,
  category: "video-editing" as const,
  level: "beginner" as const,
};

test("前後の空白を落とし、空の要点は保存しない", () => {
  const result = validateFields(fields);
  assert.ok(result.ok);
  assert.equal(result.patch.title, "カット編集の基本");
  assert.equal(result.patch.description, "説明文");
  assert.deepEqual(result.patch.key_points, ["要点1", "要点2"]);
});

test("説明が空なら null にする（空文字を残さない）", () => {
  const result = validateFields({ ...fields, description: "   " });
  assert.ok(result.ok);
  assert.equal(result.patch.description, null);
});

test("タイトルは必須", () => {
  assert.equal(validateFields({ ...fields, title: "  " }).ok, false);
});
