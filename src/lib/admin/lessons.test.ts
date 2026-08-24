import assert from "node:assert/strict";
import { test } from "node:test";

import {
  countVideoBuckets,
  durationMismatch,
  syncTargets,
  videoBucket,
  type AdminLesson,
} from "./lessons";

/**
 * REVIEW 04 の要点:
 *   「動画未設定」「処理中」「エラー」「尺未取得」を混ぜないこと。
 *   混ぜると「90 本すべて同期失敗」のような誤解を招く数字になる。
 */

function lesson(over: Partial<AdminLesson> = {}): AdminLesson {
  return {
    id: "l1",
    slug: "premiere-practice-01",
    courseId: "premiere-practice",
    courseTitle: "Premiere Pro 実践コース",
    chapterTitle: "はじめに",
    number: 1,
    title: "このコースの進め方",
    isPublished: true,
    streamVideoId: null,
    streamStatus: null,
    streamSyncedAt: null,
    streamError: null,
    durationSeconds: 0,
    ...over,
  };
}

test("動画が無いレッスンは no_video（同期失敗ではない）", () => {
  assert.equal(videoBucket(lesson()), "no_video");
});

test("動画はあるが処理中", () => {
  assert.equal(
    videoBucket(lesson({ streamVideoId: "abc", streamStatus: "pending" })),
    "processing",
  );
});

test("状態が未取得の動画も processing として扱う（安全側）", () => {
  assert.equal(
    videoBucket(lesson({ streamVideoId: "abc", streamStatus: null })),
    "processing",
  );
});

test("処理に失敗した動画", () => {
  assert.equal(
    videoBucket(lesson({ streamVideoId: "abc", streamStatus: "error" })),
    "failed",
  );
});

test("再生できるが実尺を未取得なら unsynced", () => {
  assert.equal(
    videoBucket(lesson({ streamVideoId: "abc", streamStatus: "ready", streamSyncedAt: null })),
    "unsynced",
  );
});

test("再生でき実尺も取得済みなら ready", () => {
  assert.equal(
    videoBucket(
      lesson({
        streamVideoId: "abc",
        streamStatus: "ready",
        streamSyncedAt: "2026-08-22T00:00:00Z",
      }),
    ),
    "ready",
  );
});

test("実データと同じ構成で数える（動画あり 1 / 動画なし 89）", () => {
  const lessons = [
    lesson({ id: "real", streamVideoId: "abc", streamStatus: "ready" }),
    ...Array.from({ length: 89 }, (_, i) => lesson({ id: `dummy-${i}` })),
  ];
  const counts = countVideoBuckets(lessons);
  assert.equal(counts.total, 90);
  assert.equal(counts.no_video, 89, "動画を入れていないだけの本数");
  assert.equal(counts.unsynced, 1, "同期が必要なのは 1 本だけ");
  assert.equal(counts.processing, 0);
  assert.equal(counts.failed, 0);
});

test("一括同期の対象は動画を持つレッスンだけ", () => {
  const lessons = [
    lesson({ id: "a", streamVideoId: "abc" }),
    lesson({ id: "b" }),
    lesson({ id: "c" }),
  ];
  const targets = syncTargets(lessons);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].id, "a");
});

test("尺のずれ判定。実尺が不明なときはずれとみなさない", () => {
  assert.equal(durationMismatch(765, 58), true, "DB 765 秒 / 実尺 58 秒");
  assert.equal(durationMismatch(765, 765), false);
  assert.equal(durationMismatch(765, 766), false, "1 秒の差は許容");
  assert.equal(durationMismatch(765, null), false, "未取得はずれではない");
});
