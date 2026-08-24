import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canPublishLesson,
  interpretVideo,
  normalizeDuration,
  normalizePercent,
} from "./video-state";

/**
 * ここで固定したいのは 2 つ。
 *   1. 処理中の動画を ready と誤認しないこと
 *   2. Cloudflare が「不明」を表す -1 を、尺としてそのまま保存しないこと
 */

test("尺が -1（不明）のときは null にする。DB へ -1 を入れない", () => {
  assert.equal(normalizeDuration(-1), null);
});

test("尺は四捨五入して秒で持つ", () => {
  assert.equal(normalizeDuration(765.4), 765);
  assert.equal(normalizeDuration(765.6), 766);
});

test("尺が数値でない / 極端に短い場合は null", () => {
  assert.equal(normalizeDuration(undefined), null);
  assert.equal(normalizeDuration("765"), null);
  assert.equal(normalizeDuration(Number.NaN), null);
  assert.equal(normalizeDuration(0.05), null, "0.1 秒未満は Cloudflare 側でもエラー扱い");
});

test("pctComplete は文字列で返るので数値へ直す", () => {
  assert.equal(normalizePercent("39.000000"), 39);
  assert.equal(normalizePercent("100.000000"), 100);
  assert.equal(normalizePercent(42), 42);
  assert.equal(normalizePercent("abc"), null);
  assert.equal(normalizePercent(undefined), null);
  assert.equal(normalizePercent("120"), 100, "上限で丸める");
});

test("state が ready かつ readyToStream かつ 100% なら ready", () => {
  const result = interpretVideo({
    duration: 765.4,
    readyToStream: true,
    status: { state: "ready", pctComplete: "100.000000" },
  });
  assert.deepEqual(result, {
    status: "ready",
    durationSeconds: 765,
    percent: 100,
    error: null,
  });
});

test("state が ready でも 100% 未満なら ready にしない（低画質で配らない）", () => {
  const result = interpretVideo({
    duration: 765,
    readyToStream: true,
    status: { state: "ready", pctComplete: "60.000000" },
  });
  assert.equal(result.status, "pending");
});

test("readyToStream が false なら ready にしない", () => {
  const result = interpretVideo({
    duration: 765,
    readyToStream: false,
    status: { state: "ready", pctComplete: "100.000000" },
  });
  assert.equal(result.status, "pending");
});

test("アップロード前は pending で、尺は null", () => {
  const result = interpretVideo({
    duration: -1,
    readyToStream: false,
    status: { state: "pendingupload" },
  });
  assert.equal(result.status, "pending");
  assert.equal(result.durationSeconds, null);
});

test("エンコード中は pending で、進捗を持つ", () => {
  const result = interpretVideo({
    duration: 765,
    readyToStream: false,
    status: { state: "inprogress", pctComplete: "39.000000" },
  });
  assert.equal(result.status, "pending");
  assert.equal(result.percent, 39);
});

test("失敗は理由を残す", () => {
  const result = interpretVideo({
    duration: -1,
    status: {
      state: "error",
      errorReasonCode: "ERR_NON_VIDEO",
      errorReasonText: "非対応の形式です",
    },
  });
  assert.equal(result.status, "error");
  assert.match(result.error!, /ERR_NON_VIDEO/);
  assert.match(result.error!, /非対応の形式/);
});

test("失敗理由のキー名の揺れ（errReasonCode）にも対応する", () => {
  const result = interpretVideo({
    status: { state: "error", errReasonCode: "ERR_MALFORMED_VIDEO" },
  });
  assert.match(result.error!, /ERR_MALFORMED_VIDEO/);
});

test("知らない state は落とさず処理中として扱う", () => {
  const result = interpretVideo({ status: { state: "something-new" } });
  assert.equal(result.status, "pending");
});

test("status が丸ごと無くても落ちない", () => {
  assert.equal(interpretVideo({}).status, "pending");
});

/* ---- 公開してよいかの判定（サーバー側で使う） ---- */

test("動画を持たないレッスンは公開できる（テキスト教材を締め出さない）", () => {
  assert.deepEqual(canPublishLesson({ streamVideoId: null, streamStatus: null }), {
    ok: true,
  });
});

test("動画が ready なら公開できる", () => {
  assert.deepEqual(
    canPublishLesson({ streamVideoId: "abc", streamStatus: "ready" }),
    { ok: true },
  );
});

test("処理中の動画は公開できない", () => {
  const result = canPublishLesson({ streamVideoId: "abc", streamStatus: "pending" });
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /処理中/);
});

test("状態が未取得（null）の動画も公開できない（安全側）", () => {
  assert.equal(canPublishLesson({ streamVideoId: "abc", streamStatus: null }).ok, false);
});

test("失敗した動画は理由を出して公開させない", () => {
  const result = canPublishLesson({ streamVideoId: "abc", streamStatus: "error" });
  assert.equal(result.ok, false);
  assert.match((result as { reason: string }).reason, /失敗/);
});
