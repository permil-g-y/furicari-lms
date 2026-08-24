import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildStudentRows,
  filterStudents,
  needsAttention,
  resolveAccountState,
  resolveEnrollmentState,
  type AdminCourse,
  type AdminUserRecord,
} from "./students";

/**
 * Phase 7-B の中心的な保証:
 *   「誰が“いま何も見られない状態”なのかを取り違えないこと」
 *
 * ここを間違えると、招待したのに権限を付け忘れた受講生が一覧で埋もれる。
 */

const now = new Date("2026-08-22T05:00:00Z");

const courses: AdminCourse[] = [
  { id: "premiere-practice", title: "Premiere Pro 実践コース", lessonCount: 18 },
  { id: "capcut-practice", title: "CapCut 実践コース", lessonCount: 12 },
];

function user(over: Partial<AdminUserRecord> = {}): AdminUserRecord {
  return {
    id: "u1",
    email: "student@example.com",
    displayName: "テスト",
    role: "student",
    createdAt: "2026-08-01T00:00:00Z",
    lastSignInAt: "2026-08-20T00:00:00Z",
    invitedAt: null,
    bannedUntil: null,
    ...over,
  };
}

/* ---- アカウントの状態 ---------------------------------------------- */

test("ログイン実績があれば active", () => {
  assert.equal(
    resolveAccountState({ lastSignInAt: "2026-08-20T00:00:00Z", bannedUntil: null }, now),
    "active",
  );
});

test("一度もログインしていなければ invited（招待済み）", () => {
  assert.equal(resolveAccountState({ lastSignInAt: null, bannedUntil: null }, now), "invited");
});

test("停止期限が未来なら banned", () => {
  assert.equal(
    resolveAccountState({ lastSignInAt: "2026-08-20T00:00:00Z", bannedUntil: "2026-09-01T00:00:00Z" }, now),
    "banned",
  );
});

test("停止期限が過去なら banned ではない", () => {
  assert.equal(
    resolveAccountState({ lastSignInAt: "2026-08-20T00:00:00Z", bannedUntil: "2026-08-01T00:00:00Z" }, now),
    "active",
  );
});

test("壊れた停止期限は banned として扱う（安全側）", () => {
  assert.equal(
    resolveAccountState({ lastSignInAt: "2026-08-20T00:00:00Z", bannedUntil: "not-a-date" }, now),
    "banned",
  );
});

/* ---- 受講権限の状態 ------------------------------------------------ */

test("有効な権限が 1 件でもあれば enrolled", () => {
  assert.equal(
    resolveEnrollmentState([
      { courseId: "a", courseTitle: "A", expiresAt: null, active: true },
      { courseId: "b", courseTitle: "B", expiresAt: "2026-01-01T00:00:00Z", active: false },
    ]),
    "enrolled",
  );
});

test("権限はあるが全部期限切れなら expired", () => {
  assert.equal(
    resolveEnrollmentState([
      { courseId: "b", courseTitle: "B", expiresAt: "2026-01-01T00:00:00Z", active: false },
    ]),
    "expired",
  );
});

test("権限が 1 件も無ければ none", () => {
  assert.equal(resolveEnrollmentState([]), "none");
});

/* ---- 要対応の判定 -------------------------------------------------- */

test("招待済みで権限未設定は要対応（付け忘れを拾う）", () => {
  assert.equal(needsAttention({ account: "invited", enrollment: "none" }), true);
});

test("ログイン済みでも権限が無ければ要対応", () => {
  assert.equal(needsAttention({ account: "active", enrollment: "none" }), true);
});

test("期限切れも要対応", () => {
  assert.equal(needsAttention({ account: "active", enrollment: "expired" }), true);
});

test("有効な権限があれば要対応ではない", () => {
  assert.equal(needsAttention({ account: "active", enrollment: "enrolled" }), false);
});

test("停止中は運営が意図した状態なので要対応にしない", () => {
  assert.equal(needsAttention({ account: "banned", enrollment: "none" }), false);
});

/* ---- 一覧の組み立て ------------------------------------------------ */

test("有効な受講コースのレッスン数だけを合計する", () => {
  const [row] = buildStudentRows({
    users: [user()],
    enrollments: [
      { userId: "u1", courseId: "premiere-practice", expiresAt: null },
      { userId: "u1", courseId: "capcut-practice", expiresAt: "2026-01-01T00:00:00Z" },
    ],
    progress: [],
    courses,
    now,
  });
  // 期限切れの CapCut（12 本）は含めない
  assert.equal(row.totalLessons, 18);
  assert.equal(row.enrollment, "enrolled");
});

test("完了数と最終視聴日時を集計する", () => {
  const [row] = buildStudentRows({
    users: [user()],
    enrollments: [{ userId: "u1", courseId: "premiere-practice", expiresAt: null }],
    progress: [
      { userId: "u1", lessonId: "l1", completed: true, lastViewedAt: "2026-08-21T01:00:00Z" },
      { userId: "u1", lessonId: "l2", completed: true, lastViewedAt: "2026-08-22T02:00:00Z" },
      { userId: "u1", lessonId: "l3", completed: false, lastViewedAt: "2026-08-19T00:00:00Z" },
    ],
    courses,
    now,
  });
  assert.equal(row.completedLessons, 2);
  assert.equal(row.lastViewedAt, "2026-08-22T02:00:00Z");
});

test("一覧に無いコースの受講権限は表示しない", () => {
  const [row] = buildStudentRows({
    users: [user()],
    enrollments: [{ userId: "u1", courseId: "unknown-course", expiresAt: null }],
    progress: [],
    courses,
    now,
  });
  assert.equal(row.enrollments.length, 0);
  assert.equal(row.enrollment, "none");
  assert.equal(row.needsAttention, true);
});

test("表示名が未設定ならメールアドレスから補う", () => {
  const [row] = buildStudentRows({
    users: [user({ displayName: "   " })],
    enrollments: [],
    progress: [],
    courses,
    now,
  });
  assert.equal(row.displayName, "student");
});

test("他人の進捗が混ざらない", () => {
  const rows = buildStudentRows({
    users: [user(), user({ id: "u2", email: "b@example.com", displayName: "B" })],
    enrollments: [],
    progress: [
      { userId: "u1", lessonId: "l1", completed: true, lastViewedAt: "2026-08-21T00:00:00Z" },
    ],
    courses,
    now,
  });
  assert.equal(rows[0].completedLessons, 1);
  assert.equal(rows[1].completedLessons, 0);
  assert.equal(rows[1].lastViewedAt, null);
});

/* ---- 絞り込み ------------------------------------------------------ */

test("名前とメールの部分一致で絞り込める", () => {
  const rows = buildStudentRows({
    users: [
      user({ id: "u1", email: "alice@example.com", displayName: "アリス" }),
      user({ id: "u2", email: "bob@example.com", displayName: "ボブ" }),
    ],
    enrollments: [],
    progress: [],
    courses,
    now,
  });
  assert.equal(filterStudents(rows, "アリス").length, 1);
  assert.equal(filterStudents(rows, "bob@").length, 1);
  assert.equal(filterStudents(rows, "EXAMPLE.COM").length, 2);
  assert.equal(filterStudents(rows, "  ").length, 2);
  assert.equal(filterStudents(rows, "存在しない").length, 0);
});
