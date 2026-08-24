import assert from "node:assert/strict";
import { test } from "node:test";

import {
  announcementState,
  cleanBlocks,
  emptyBlock,
  moveBlock,
  removeBlock,
  toJstTimestamp,
  validateDraft,
  type DraftBlock,
} from "./announcement-draft";

/**
 * お知らせは受講生への唯一の連絡手段。
 * ここで固定したいのは「空のお知らせを配らないこと」と
 * 「公開日時が 9 時間ずれないこと」。
 */

const base = {
  slug: "summer-course",
  title: "夏の新コースについて",
  category: "new_course" as const,
  publishDate: "2026-09-01",
  publishTime: "10:00",
  isPublished: true,
  blocks: [{ type: "paragraph", text: "本文" }] as DraftBlock[],
};

/* ---- 公開日時（JST） ---- */

test("公開日時は JST として解釈する", () => {
  assert.equal(toJstTimestamp("2026-09-01", "10:00"), "2026-09-01T10:00:00+09:00");
});

test("JST の 10:00 は UTC の 01:00", () => {
  assert.equal(
    new Date(toJstTimestamp("2026-09-01", "10:00")!).toISOString(),
    "2026-09-01T01:00:00.000Z",
  );
});

test("時刻が空なら 0 時として扱う", () => {
  assert.equal(toJstTimestamp("2026-09-01", ""), "2026-09-01T00:00:00+09:00");
});

test("壊れた日時は受け付けない", () => {
  assert.equal(toJstTimestamp("2026/09/01", "10:00"), null);
  assert.equal(toJstTimestamp("2026-09-01", "25時"), null);
});

/* ---- ブロックの編集 ---- */

test("ブロックを入れ替えても中身が壊れない", () => {
  const blocks: DraftBlock[] = [
    { type: "heading", text: "A" },
    { type: "paragraph", text: "B" },
    { type: "paragraph", text: "C" },
  ];
  assert.deepEqual(moveBlock(blocks, 0, 1).map((b) => "text" in b && b.text), ["B", "A", "C"]);
  assert.deepEqual(moveBlock(blocks, 2, -1).map((b) => "text" in b && b.text), ["A", "C", "B"]);
});

test("端のブロックを外へ動かそうとしても壊れない", () => {
  const blocks: DraftBlock[] = [{ type: "heading", text: "A" }, { type: "paragraph", text: "B" }];
  assert.deepEqual(moveBlock(blocks, 0, -1), blocks);
  assert.deepEqual(moveBlock(blocks, 1, 1), blocks);
});

test("ブロックを削除できる", () => {
  const blocks: DraftBlock[] = [
    { type: "heading", text: "A" },
    { type: "paragraph", text: "B" },
  ];
  assert.deepEqual(removeBlock(blocks, 0), [{ type: "paragraph", text: "B" }]);
  assert.deepEqual(removeBlock(blocks, 9), blocks, "範囲外でも壊さない");
});

test("空のブロックは保存しない（受講生の画面に空白を出さない）", () => {
  const blocks: DraftBlock[] = [
    { type: "heading", text: "  見出し  " },
    { type: "paragraph", text: "   " },
    { type: "callout", title: "", items: ["", "  "] },
    { type: "callout", title: "対象", items: ["受講生のみなさま", " "] },
  ];
  assert.deepEqual(cleanBlocks(blocks), [
    { type: "heading", text: "見出し" },
    { type: "callout", title: "対象", items: ["受講生のみなさま"] },
  ]);
});

test("新規ブロックの雛形", () => {
  assert.deepEqual(emptyBlock("paragraph"), { type: "paragraph", text: "" });
  assert.deepEqual(emptyBlock("callout"), { type: "callout", title: "", items: [""] });
});

/* ---- 入力の検証 ---- */

test("正しい入力は通る", () => {
  const result = validateDraft(base);
  assert.ok(result.ok);
  assert.equal(result.draft.publishedAt, "2026-09-01T10:00:00+09:00");
  assert.equal(result.draft.body.length, 1);
});

test("本文が空のまま公開しようとしたら止める", () => {
  const result = validateDraft({ ...base, blocks: [{ type: "paragraph", text: "  " }] });
  assert.equal(result.ok, false);
  assert.match((result as { message: string }).message, /本文/);
});

test("下書きなら本文が空でも保存できる（書きかけを残せる）", () => {
  const result = validateDraft({ ...base, isPublished: false, blocks: [] });
  assert.ok(result.ok);
  assert.equal(result.draft.body.length, 0);
});

test("タイトルは必須", () => {
  assert.equal(validateDraft({ ...base, title: "   " }).ok, false);
});

test("URL 用の ID は英数字とハイフンだけ", () => {
  assert.equal(validateDraft({ ...base, slug: "" }).ok, false);
  assert.equal(validateDraft({ ...base, slug: "夏のお知らせ" }).ok, false);
  assert.equal(validateDraft({ ...base, slug: "summer course" }).ok, false);
  assert.equal(validateDraft({ ...base, slug: "-summer-" }).ok, false);
  assert.ok(validateDraft({ ...base, slug: "Summer-2026" }).ok, "大文字は小文字へ直して通す");
});

/* ---- 一覧の状態 ---- */

test("未公開は下書き", () => {
  const now = new Date("2026-08-24T00:00:00Z");
  assert.equal(
    announcementState({ isPublished: false, publishedAt: "2026-08-01T00:00:00Z" }, now),
    "draft",
  );
});

test("公開日時が未来なら公開予定", () => {
  const now = new Date("2026-08-24T00:00:00Z");
  assert.equal(
    announcementState({ isPublished: true, publishedAt: "2026-09-01T00:00:00Z" }, now),
    "scheduled",
  );
});

test("公開日時が過ぎていれば公開中", () => {
  const now = new Date("2026-08-24T00:00:00Z");
  assert.equal(
    announcementState({ isPublished: true, publishedAt: "2026-08-01T00:00:00Z" }, now),
    "published",
  );
});
