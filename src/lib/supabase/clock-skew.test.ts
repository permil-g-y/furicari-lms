import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createClockSkewTolerantFetch,
  isReplayable,
  readIssuedAt,
} from "./clock-skew";

/**
 * ここで固定したいのは 2 つ。
 *
 *   1. PGRST303（Supabase 側の秒未満の時計差）だけを再試行すること
 *   2. **それ以外の 401 / 403 は 1 度も再試行しないこと**
 *
 * 2 を崩すと、失効したトークンや権限不足を握りつぶすことになり、
 * 認証を緩めたのと同じになる。
 */

const DELAYS = [1, 1, 1];

function jsonResponse(status: number, body: unknown, date?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(date ? { date } : {}) },
  });
}

/** 呼ばれた回数を数えつつ、順番に用意した応答を返す fetch */
function stubFetch(responses: (() => Response)[]) {
  const calls: RequestInit[] = [];
  const impl = (async (_input: unknown, init?: RequestInit) => {
    calls.push(init ?? {});
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    return next();
  }) as unknown as typeof fetch;
  return { impl, calls };
}

/* ---- iat の読み取り（計測用） ---------------------------------------- */

test("Authorization ヘッダから iat だけを取り出せる", () => {
  const payload = Buffer.from(JSON.stringify({ iat: 1787325315, sub: "u1" })).toString(
    "base64url",
  );
  const token = `header.${payload}.signature`;
  assert.equal(readIssuedAt({ authorization: `Bearer ${token}` }), 1787325315);
});

test("トークンが無い / 壊れている場合は null（計測できないだけで動作は続く）", () => {
  assert.equal(readIssuedAt(undefined), null);
  assert.equal(readIssuedAt({ authorization: "Bearer not-a-jwt" }), null);
  assert.equal(readIssuedAt({ authorization: "Bearer a.!!!.c" }), null);
  assert.equal(readIssuedAt({ "content-type": "application/json" }), null);
});

/* ---- 再試行の対象 ---------------------------------------------------- */

test("PGRST303 は時計差が解けるまで再試行する", async () => {
  const { impl, calls } = stubFetch([
    () => jsonResponse(401, { code: "PGRST303", message: "JWT issued at future" }),
    () => jsonResponse(401, { code: "PGRST303", message: "JWT issued at future" }),
    () => jsonResponse(200, [{ id: "1" }]),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  const response = await wrapped("https://example.test/rest/v1/courses");
  assert.equal(response.status, 200);
  assert.equal(calls.length, 3, "2 回失敗して 3 回目で成功する");
});

test("失効したトークン（PGRST301）は再試行しない", async () => {
  const { impl, calls } = stubFetch([
    () => jsonResponse(401, { code: "PGRST301", message: "JWT expired" }),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  const response = await wrapped("https://example.test/rest/v1/courses");
  assert.equal(response.status, 401);
  assert.equal(calls.length, 1, "1 度きり。認証エラーを握りつぶさない");
});

test("権限不足（403）は再試行しない", async () => {
  const { impl, calls } = stubFetch([
    () => jsonResponse(403, { code: "42501", message: "permission denied" }),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  assert.equal((await wrapped("https://example.test/rest/v1/x")).status, 403);
  assert.equal(calls.length, 1);
});

test("JSON でないエラー応答は再試行しない", async () => {
  const { impl, calls } = stubFetch([
    () => new Response("<html>Bad Gateway</html>", { status: 502 }),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  assert.equal((await wrapped("https://example.test/rest/v1/x")).status, 502);
  assert.equal(calls.length, 1);
});

test("成功した応答はそのまま返す（余計な読み取りをしない）", async () => {
  const { impl, calls } = stubFetch([() => jsonResponse(200, [{ id: "1" }])]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  const response = await wrapped("https://example.test/rest/v1/courses");
  assert.deepEqual(await response.json(), [{ id: "1" }]);
  assert.equal(calls.length, 1);
});

test("解消しなければ諦めて元の応答を返す（無限に粘らない）", async () => {
  let gaveUp = false;
  const { impl, calls } = stubFetch([
    () => jsonResponse(401, { code: "PGRST303", message: "JWT issued at future" }),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
    onGiveUp: () => {
      gaveUp = true;
    },
  });

  assert.equal((await wrapped("https://example.test/rest/v1/x")).status, 401);
  assert.equal(calls.length, DELAYS.length + 1, "初回 + 再試行の回数で打ち切る");
  assert.equal(gaveUp, true);
});

/* ---- 計測 ------------------------------------------------------------ */

test("最初の失敗のときだけ iat とサーバー時刻を記録する", async () => {
  // Fri, 22 Aug 2026 05:15:15 GMT = 1787375715。その 1 秒先を発行時刻とする
  const iat = 1787375716;
  const payload = Buffer.from(JSON.stringify({ iat })).toString("base64url");
  const detected: { iat: number | null; serverEpoch: number | null }[] = [];

  const { impl } = stubFetch([
    () =>
      jsonResponse(401, { code: "PGRST303" }, "Fri, 22 Aug 2026 05:15:15 GMT"),
    () => jsonResponse(401, { code: "PGRST303" }, "Fri, 22 Aug 2026 05:15:15 GMT"),
    () => jsonResponse(200, []),
  ]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
    onSkewDetected: (info) => detected.push(info),
  });

  await wrapped("https://example.test/rest/v1/x", {
    headers: { authorization: `Bearer h.${payload}.s` },
  });

  assert.equal(detected.length, 1, "毎回ログを出すとノイズになる");
  assert.equal(detected[0].iat, iat);
  assert.equal(detected[0].serverEpoch, 1787375715);
  assert.equal(detected[0].iat! - detected[0].serverEpoch!, 1, "1 秒先行していた");
});

/* ---- 投げ直せないリクエスト ------------------------------------------ */

test("本文がストリームのリクエストは再試行しない（2 回目を送れないため）", async () => {
  assert.equal(isReplayable(undefined), true);
  assert.equal(isReplayable({ body: '{"a":1}' }), true);
  assert.equal(isReplayable({ body: new ReadableStream() }), false);

  const { impl, calls } = stubFetch([() => jsonResponse(401, { code: "PGRST303" })]);
  const wrapped = createClockSkewTolerantFetch({
    fetchImpl: impl,
    delaysMs: DELAYS,
    sleep: async () => {},
  });

  await wrapped("https://example.test/rest/v1/x", { body: new ReadableStream() });
  assert.equal(calls.length, 1);
});
