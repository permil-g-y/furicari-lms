import assert from "node:assert/strict";
import { test } from "node:test";

import {
  countStreakDays,
  formatWatchTime,
  jstDateGroupLabel,
  jstDateKey,
  jstTimeLabel,
  jstTodayLabel,
} from "@/lib/content/format";
import { formatDate } from "@/components/home/util";
import { buildProgressSource, type LessonMeta, type ProgressRecord } from "./compute";

/**
 * Phase 5 の中心的な保証:
 *   「進捗の集計と日付の扱いが仕様どおりであること」
 *
 * 特に日付は、サーバーが UTC で動くこと（Vercel / Supabase）に起因する
 * ずれが起きやすい。テストは意図的に UTC 環境を前提に書いてある。
 */

/* ------------------------------------------------------------------ *
 * 日付・時刻（日本時間）
 * ------------------------------------------------------------------ */

test("UTC の深夜でも日本時間の暦日で判定される", () => {
  // 2026-08-21 00:30 JST = 2026-08-20 15:30 UTC
  const date = new Date("2026-08-20T15:30:00Z");
  assert.equal(jstDateKey(date), "2026-08-21");
  assert.equal(jstTimeLabel(date), "00:30");
});

test("日本時間の朝 9 時より前でも前日扱いにならない", () => {
  // 2026-08-21 08:00 JST = 2026-08-20 23:00 UTC
  // タイムゾーンを指定し忘れると 08-20 になり、連続学習日数が途切れる
  assert.equal(jstDateKey(new Date("2026-08-20T23:00:00Z")), "2026-08-21");
});

test("TOP の基準日ラベルが Claude Design の書式になる", () => {
  // 2026-08-19 は水曜日
  assert.equal(jstTodayLabel(new Date("2026-08-19T03:00:00Z")), "2026年8月19日（水）");
});

test("学習履歴の見出しが 今日 / 昨日 / 日付 に分かれる", () => {
  const now = new Date("2026-08-21T05:00:00Z"); // 8/21 14:00 JST
  assert.equal(jstDateGroupLabel(new Date("2026-08-21T01:00:00Z"), now), "今日");
  assert.equal(jstDateGroupLabel(new Date("2026-08-20T01:00:00Z"), now), "昨日");
  // 2026-08-17 は月曜日。
  // ダミーデータ（src/lib/mock/user.ts）は「（日）」になっているが、
  // あれは Claude Design の見た目を作るための固定文字列で実在の曜日ではない。
  // 実データ化にあたり、曜日は日本時間の暦から必ず正しく求める。
  assert.equal(
    jstDateGroupLabel(new Date("2026-08-17T01:00:00Z"), now),
    "2026/08/17（月）",
  );
});

test("連続学習日数は今日または昨日から途切れるまで数える", () => {
  const now = new Date("2026-08-21T05:00:00Z");

  // 今日から 3 日連続
  assert.equal(countStreakDays(["2026-08-21", "2026-08-20", "2026-08-19"], now), 3);
  // 昨日までの連続も途切れ扱いにしない（今日まだ学習していないだけ）
  assert.equal(countStreakDays(["2026-08-20", "2026-08-19"], now), 2);
  // 一昨日で止まっていれば 0
  assert.equal(countStreakDays(["2026-08-19", "2026-08-18"], now), 0);
  // 同じ日に複数回学習しても 1 日として数える
  assert.equal(countStreakDays(["2026-08-21", "2026-08-21", "2026-08-20"], now), 2);
  // 記録が無ければ 0
  assert.equal(countStreakDays([], now), 0);
  // 月をまたぐ連続
  assert.equal(
    countStreakDays(["2026-08-01", "2026-07-31", "2026-07-30"], new Date("2026-08-01T05:00:00Z")),
    3,
  );
});

test("timestamptz でも新着動画の日付が YYYY/MM/DD で出る", () => {
  // lessons.published_at は timestamptz なので時刻とオフセットが付いてくる。
  // ハイフン置換だけだと "2026/08/18T00:00:00+00:00" がそのまま画面に出る。
  assert.equal(formatDate("2026-08-18T00:00:00+00:00"), "2026/08/18");
  // 日付だけの文字列でも壊れない
  assert.equal(formatDate("2026-08-18"), "2026/08/18");
  // UTC 深夜は日本時間では翌日
  assert.equal(formatDate("2026-08-18T15:30:00+00:00"), "2026/08/19");
});

test("総学習時間の表記", () => {
  assert.equal(formatWatchTime(51_600), "14時間20分");
  assert.equal(formatWatchTime(2_700), "45分");
  assert.equal(formatWatchTime(0), "0分");
});

/* ------------------------------------------------------------------ *
 * 進捗の集計
 * ------------------------------------------------------------------ */

const lessons: LessonMeta[] = [
  { id: "course-a-01", courseId: "course-a", durationSeconds: 600 },
  { id: "course-a-02", courseId: "course-a", durationSeconds: 600 },
  { id: "course-a-03", courseId: "course-a", durationSeconds: 600 },
  { id: "course-b-01", courseId: "course-b", durationSeconds: 300 },
  { id: "course-b-02", courseId: "course-b", durationSeconds: 300 },
  { id: "course-c-01", courseId: "course-c", durationSeconds: 300 },
];
const courseIds = ["course-a", "course-b", "course-c"];
const now = new Date("2026-08-21T05:00:00Z");

function record(
  lessonId: string,
  over: Partial<ProgressRecord> = {},
): ProgressRecord {
  return {
    lessonId,
    status: "in_progress",
    positionSeconds: 0,
    completedAt: null,
    lastViewedAt: "2026-08-21T04:00:00Z",
    ...over,
  };
}

function build(records: ProgressRecord[], extra: Partial<Parameters<typeof buildProgressSource>[0]> = {}) {
  return buildProgressSource({
    lessons,
    courseIds,
    records,
    viewEvents: [],
    favoriteLessonIds: [],
    favoriteCourseIds: [],
    now,
    ...extra,
  });
}

test("記録が無ければすべて未視聴になる", () => {
  const p = build([]);
  assert.deepEqual(p.completedLessonsByCourse, {
    "course-a": 0,
    "course-b": 0,
    "course-c": 0,
  });
  assert.equal(p.courseStatus["course-a"], "not_started");
  assert.equal(p.learningStats.completedLessons, 0);
  assert.equal(p.learningStats.totalWatchTimeLabel, "0分");
  assert.equal(p.learningStats.streakDays, 0);
  assert.deepEqual(p.resumeLessonIds, []);
});

test("コースの受講状態が完了件数から導かれる", () => {
  const p = build([
    record("course-a-01", { status: "completed", completedAt: "2026-08-20T00:00:00Z" }),
    record("course-a-02", { status: "in_progress", positionSeconds: 120 }),
    record("course-b-01", { status: "completed", completedAt: "2026-08-20T00:00:00Z" }),
    record("course-b-02", { status: "completed", completedAt: "2026-08-20T00:00:00Z" }),
  ]);

  assert.equal(p.courseStatus["course-a"], "in_progress");
  // 全レッスンが完了したコースは completed
  assert.equal(p.courseStatus["course-b"], "completed");
  // 一度も触れていないコースは not_started
  assert.equal(p.courseStatus["course-c"], "not_started");

  assert.equal(p.completedLessonsByCourse["course-a"], 1);
  assert.equal(p.completedLessonsByCourse["course-b"], 2);

  assert.equal(p.learningStats.activeCourses, 1);
  assert.equal(p.learningStats.completedCourses, 1);
});

test("「学習を続ける」は最後に視聴したレッスンへ向く", () => {
  const p = build([
    record("course-a-01", { lastViewedAt: "2026-08-19T00:00:00Z" }),
    record("course-a-03", { lastViewedAt: "2026-08-21T00:00:00Z" }),
    record("course-a-02", { lastViewedAt: "2026-08-20T00:00:00Z" }),
  ]);
  assert.equal(p.nextLessonByCourse["course-a"], "course-a-03");
  // 未視聴のコースは第 1 レッスン
  assert.equal(p.nextLessonByCourse["course-c"], "course-c-01");
});

test("続きから学ぶは視聴途中の動画を新しい順に 3 件まで", () => {
  const p = build([
    record("course-a-01", { lastViewedAt: "2026-08-18T00:00:00Z" }),
    record("course-a-02", { lastViewedAt: "2026-08-21T00:00:00Z" }),
    record("course-b-01", { lastViewedAt: "2026-08-20T00:00:00Z" }),
    record("course-b-02", { lastViewedAt: "2026-08-19T00:00:00Z" }),
    // 完了済みは「続きから」に出さない
    record("course-c-01", {
      status: "completed",
      completedAt: "2026-08-21T00:00:00Z",
      lastViewedAt: "2026-08-21T02:00:00Z",
    }),
  ]);
  assert.deepEqual(p.resumeLessonIds, ["course-a-02", "course-b-01", "course-b-02"]);
});

test("総学習時間は到達位置の合計で、尺を超えない", () => {
  const p = build([
    record("course-a-01", { positionSeconds: 300 }),
    // 尺（600秒）を超える値が入っていても切り詰める
    record("course-a-02", { positionSeconds: 9999 }),
  ]);
  assert.equal(p.learningStats.totalWatchTimeLabel, "15分");
  assert.equal(p.lessonProgress.find((l) => l.lessonId === "course-a-02")?.positionSeconds, 600);
});

test("完了したレッスンは再生位置が 0 でも尺いっぱい学習したと数える", () => {
  // 「視聴済みにする」で完了させた直後の状態（再生位置は 0 のまま）
  const p = build([
    record("course-a-01", {
      status: "completed",
      completedAt: "2026-08-21T00:00:00Z",
      positionSeconds: 0,
    }),
  ]);
  assert.equal(p.learningStats.completedLessons, 1);
  // 1本完了しているのに「0分」にならない
  assert.equal(p.learningStats.totalWatchTimeLabel, "10分");
});

test("今週の学習は直近 7 日以内に完了した本数", () => {
  const p = build([
    record("course-a-01", { status: "completed", completedAt: "2026-08-20T00:00:00Z" }),
    record("course-a-02", { status: "completed", completedAt: "2026-08-16T00:00:00Z" }),
    // 8 日前は範囲外
    record("course-b-01", { status: "completed", completedAt: "2026-08-13T00:00:00Z" }),
  ]);
  assert.equal(p.learningStats.completedLessons, 3);
  assert.equal(p.learningStats.weeklyLessons, 2);
});

test("学習履歴は新しい順に並び、日付見出しが付く", () => {
  const p = build([], {
    viewEvents: [
      { id: "e1", lessonId: "course-a-01", viewedAt: "2026-08-20T01:00:00Z" },
      { id: "e2", lessonId: "course-a-02", viewedAt: "2026-08-21T02:00:00Z" },
      // 教材に存在しないレッスンの履歴は無視する
      { id: "e3", lessonId: "deleted-lesson", viewedAt: "2026-08-21T03:00:00Z" },
    ],
  });
  assert.deepEqual(p.viewEvents.map((e) => e.id), ["e2", "e1"]);
  assert.equal(p.viewEvents[0].dateGroup, "今日");
  assert.equal(p.viewEvents[1].dateGroup, "昨日");
  assert.equal(p.learningStats.streakDays, 2);
});

test("教材に存在しない記録・お気に入りは集計から除外される", () => {
  const p = build([record("deleted-lesson", { status: "completed", completedAt: "2026-08-20T00:00:00Z" })], {
    favoriteLessonIds: ["course-a-01", "deleted-lesson"],
    favoriteCourseIds: ["course-a", "deleted-course"],
  });
  assert.equal(p.learningStats.completedLessons, 0);
  assert.deepEqual(p.favoriteLessonIds, ["course-a-01"]);
  assert.deepEqual(p.favoriteCourseIds, ["course-a"]);
});

test("キュレーションは進捗に影響されず現行の並びを維持する", () => {
  const p = build([]);
  assert.equal(p.videoListOrder[0], "premiere-practice-05");
  assert.equal(p.videoListOrder.length, 9);
  assert.equal(p.recommendedCourseIds[0], "capcut-practice");
  assert.equal(p.newLessonIds[0], "ai-editing-09");
});
