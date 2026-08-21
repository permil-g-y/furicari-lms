import assert from "node:assert/strict";
import { test } from "node:test";

import { canAccessCourse, isEnrollmentActive } from "./access";

/**
 * Phase 6-E の中心的な保証:
 *   「受講権限の解釈が仕様どおりであること」
 *
 * ここを間違えると、受講生が締め出されるか、
 * 逆に未受講のまま動画が見られてしまう。
 */

const now = new Date("2026-08-21T05:00:00Z");

/* ---- 期限の解釈 ---------------------------------------------------- */

test("expires_at が NULL なら無期限", () => {
  assert.equal(isEnrollmentActive(null, now), true);
});

test("expires_at が未来なら有効", () => {
  assert.equal(isEnrollmentActive("2026-09-01T00:00:00Z", now), true);
});

test("expires_at が過去なら期限切れ", () => {
  assert.equal(isEnrollmentActive("2026-08-01T00:00:00Z", now), false);
});

test("期限が現在ちょうどなら期限切れとして扱う", () => {
  assert.equal(isEnrollmentActive(now.toISOString(), now), false);
});

test("壊れた日時は期限切れとして扱う（安全側に倒す）", () => {
  assert.equal(isEnrollmentActive("not-a-date", now), false);
});

/* ---- コースへのアクセス判定 ----------------------------------------- */

test("受講中のコースは再生できる", () => {
  const access = { enrolledCourseIds: new Set(["premiere-practice"]), isAdmin: false };
  assert.equal(canAccessCourse(access, "premiere-practice"), true);
});

test("受講していないコースは再生できない", () => {
  const access = { enrolledCourseIds: new Set(["premiere-practice"]), isAdmin: false };
  assert.equal(canAccessCourse(access, "ai-editing"), false);
});

test("受講権限が 1 件も無ければ、どのコースも再生できない", () => {
  const access = { enrolledCourseIds: new Set<string>(), isAdmin: false };
  assert.equal(canAccessCourse(access, "premiere-practice"), false);
});

test("管理者は受講権限が無くても全コースを再生できる", () => {
  const access = { enrolledCourseIds: new Set<string>(), isAdmin: true };
  assert.equal(canAccessCourse(access, "premiere-practice"), true);
  assert.equal(canAccessCourse(access, "ai-editing"), true);
});
