import assert from "node:assert/strict";
import { test } from "node:test";

import { adminDate, expiryLabel, progressLabel, studentStatus } from "./format";

test("日付は JST で解釈する（UTC 深夜のずれを防ぐ）", () => {
  // UTC では 8/21 だが JST では 8/22
  assert.equal(adminDate("2026-08-21T15:30:00Z"), "2026/08/22");
});

test("日付が無い / 壊れている場合は — を返す", () => {
  assert.equal(adminDate(null), "—");
  assert.equal(adminDate("not-a-date"), "—");
});

test("期限 null は無期限", () => {
  assert.equal(expiryLabel(null), "無期限");
  assert.equal(expiryLabel("2026-12-31T00:00:00+09:00"), "2026/12/31 まで");
});

test("招待済みで権限未設定は警告として出す", () => {
  assert.deepEqual(studentStatus({ account: "invited", enrollment: "none" }), {
    label: "招待済み・権限未設定",
    tone: "warn",
  });
});

test("招待済みで権限があれば警告にしない", () => {
  assert.equal(
    studentStatus({ account: "invited", enrollment: "enrolled" }).tone,
    "muted",
  );
});

test("受講中 / 期限切れ / 権限未設定を言い分ける", () => {
  assert.equal(studentStatus({ account: "active", enrollment: "enrolled" }).label, "受講中");
  assert.equal(studentStatus({ account: "active", enrollment: "expired" }).label, "期限切れ");
  assert.equal(studentStatus({ account: "active", enrollment: "none" }).label, "権限未設定");
});

test("停止中は受講権限に関わらず停止中と出す", () => {
  assert.equal(studentStatus({ account: "banned", enrollment: "enrolled" }).label, "停止中");
});

test("進捗ラベル", () => {
  assert.equal(progressLabel(4, 18), "4 / 18 本（22%）");
  assert.equal(progressLabel(0, 0), "—");
});
