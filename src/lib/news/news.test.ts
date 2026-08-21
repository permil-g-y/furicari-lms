import assert from "node:assert/strict";
import { test } from "node:test";

import type { AnnouncementRow } from "@/lib/supabase/database.types";
import { buildAnnouncement, buildAnnouncements } from "./snapshot";

/**
 * Phase 6-A の中心的な保証:
 *   「DB 行が Phase 1 と同じ形の Announcement になること」
 *
 * 特に date と isNew は DB に持たず published_at から算出するため、
 * 日本時間での判定がずれないことをここで固定する。
 */

const base: AnnouncementRow = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "ann-01",
  title: "テストのお知らせ",
  category: "new_course",
  body: [{ type: "paragraph", text: "本文" }],
  related_links: [{ icon: "icon-book", label: "リンク", href: "/courses" }],
  published_at: "2026-08-17T15:00:00+00:00", // = 2026-08-18 00:00 JST
  is_published: true,
  created_at: "2026-08-17T15:00:00+00:00",
  updated_at: "2026-08-17T15:00:00+00:00",
};

const now = new Date("2026-08-21T05:00:00Z"); // 8/21 14:00 JST

test("id には uuid ではなく slug が入る（/news/ann-01 の URL を維持）", () => {
  assert.equal(buildAnnouncement(base, now).id, "ann-01");
});

test("表示日は日本時間の暦日になる", () => {
  // UTC では 8/17 だが、日本時間では 8/18
  assert.equal(buildAnnouncement(base, now).date, "2026/08/18");
});

test("UTC 深夜の公開でも日本時間の日付で出る", () => {
  const row = { ...base, published_at: "2026-08-20T15:30:00+00:00" };
  assert.equal(buildAnnouncement(row, now).date, "2026/08/21");
});

test("NEW バッジは公開からの経過日数で決まる", () => {
  // 3 日前 → NEW
  assert.equal(buildAnnouncement(base, now).isNew, true);
  // 10 日前 → NEW ではない
  const old = { ...base, published_at: "2026-08-11T00:00:00+09:00" };
  assert.equal(buildAnnouncement(old, now).isNew, false);
});

test("本文と関連リンクがそのままの形で渡る", () => {
  const a = buildAnnouncement(base, now);
  assert.equal(a.body?.length, 1);
  assert.equal(a.relatedLinks?.length, 1);
});

test("空の本文・空のリンクは undefined になる（画面側の分岐に合わせる）", () => {
  const empty = { ...base, body: [], related_links: [] };
  const a = buildAnnouncement(empty, now);
  assert.equal(a.body, undefined);
  assert.equal(a.relatedLinks, undefined);
});

test("一覧は公開日の新しい順に並ぶ", () => {
  const rows: AnnouncementRow[] = [
    { ...base, slug: "old", published_at: "2026-08-01T00:00:00+09:00" },
    { ...base, slug: "new", published_at: "2026-08-20T00:00:00+09:00" },
    { ...base, slug: "mid", published_at: "2026-08-10T00:00:00+09:00" },
  ];
  assert.deepEqual(
    buildAnnouncements(rows, now).map((a) => a.id),
    ["new", "mid", "old"],
  );
});
