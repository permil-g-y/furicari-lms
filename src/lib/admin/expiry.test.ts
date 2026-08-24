import assert from "node:assert/strict";
import { test } from "node:test";

import {
  endOfJstDay,
  isExpiringSoon,
  monthsFromNow,
  resolveExpiry,
} from "./expiry";

/**
 * 受講期限は課金に直結する。
 * 「12/31 まで」と設定したのに 12/31 の昼に切れる、が起きないことを固定する。
 */

test("指定日は JST のその日の終わりまで有効にする", () => {
  assert.equal(endOfJstDay("2026-12-31"), "2026-12-31T23:59:59+09:00");
});

test("JST の終わりは UTC では翌日の 14:59:59", () => {
  const iso = endOfJstDay("2026-12-31");
  assert.equal(new Date(iso!).toISOString(), "2026-12-31T14:59:59.000Z");
});

test("存在しない日付は受け付けない", () => {
  assert.equal(endOfJstDay("2026-02-30"), null);
  assert.equal(endOfJstDay("2026-13-01"), null);
  assert.equal(endOfJstDay("2026/12/31"), null);
  assert.equal(endOfJstDay(""), null);
});

test("うるう年の 2/29 は受け付ける", () => {
  assert.equal(endOfJstDay("2028-02-29"), "2028-02-29T23:59:59+09:00");
  assert.equal(endOfJstDay("2027-02-29"), null);
});

test("N ヶ月後を JST のカレンダーで計算する", () => {
  const now = new Date("2026-08-22T05:00:00Z"); // JST 8/22 14:00
  assert.equal(monthsFromNow(3, now), "2026-11-22T23:59:59+09:00");
  assert.equal(monthsFromNow(12, now), "2027-08-22T23:59:59+09:00");
});

test("UTC では前日でも JST の日付で計算する", () => {
  // UTC 8/21 23:00 = JST 8/22 08:00
  const now = new Date("2026-08-21T23:00:00Z");
  assert.equal(monthsFromNow(3, now), "2026-11-22T23:59:59+09:00");
});

test("月末は繰り上がらないよう丸める", () => {
  const now = new Date("2026-01-31T03:00:00Z"); // JST 1/31
  assert.equal(monthsFromNow(1, now), "2026-02-28T23:59:59+09:00");
  const leap = new Date("2028-01-31T03:00:00Z");
  assert.equal(monthsFromNow(1, leap), "2028-02-29T23:59:59+09:00");
});

test("年をまたぐ加算", () => {
  const now = new Date("2026-11-15T03:00:00Z");
  assert.equal(monthsFromNow(3, now), "2027-02-15T23:59:59+09:00");
});

test("無期限は null", () => {
  assert.deepEqual(resolveExpiry("unlimited", "", new Date()), { expiresAt: null });
});

test("過去の日付は拒否する", () => {
  const now = new Date("2026-08-22T05:00:00Z");
  const result = resolveExpiry("custom", "2026-08-01", now);
  assert.ok("error" in result);
});

test("当日を指定してもその日の終わりまでは有効", () => {
  const now = new Date("2026-08-22T05:00:00Z"); // JST 8/22 14:00
  const result = resolveExpiry("custom", "2026-08-22", now);
  assert.deepEqual(result, { expiresAt: "2026-08-22T23:59:59+09:00" });
});

test("未知のプリセットは拒否する", () => {
  const result = resolveExpiry("forever-and-ever", "", new Date());
  assert.ok("error" in result);
});

test("期限切れが近いかを判定する", () => {
  const now = new Date("2026-08-22T05:00:00Z");
  assert.equal(isExpiringSoon("2026-08-25T23:59:59+09:00", now), true);
  assert.equal(isExpiringSoon("2026-09-30T23:59:59+09:00", now), false);
  assert.equal(isExpiringSoon("2026-08-01T23:59:59+09:00", now), false, "既に切れている");
  assert.equal(isExpiringSoon(null, now), false, "無期限");
  assert.equal(isExpiringSoon("not-a-date", now), false);
});
