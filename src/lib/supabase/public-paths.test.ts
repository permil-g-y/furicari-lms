import assert from "node:assert/strict";
import { test } from "node:test";

import { isPublicPath } from "./public-paths";

/**
 * 公開パスの判定は「守るべき画面を公開してしまう」事故と
 * 「機械用エンドポイントが静かにログインへ飛ばされる」事故の両方に直結する。
 * どちらも例外が出ないので、ここで固定しておく。
 */

test("受講生向けの画面はログイン必須のまま", () => {
  for (const path of ["/", "/videos", "/watch/abc", "/news", "/search"]) {
    assert.equal(isPublicPath(path), false, path);
  }
});

test("管理画面はログイン必須のまま", () => {
  for (const path of ["/admin", "/admin/students", "/admin/lessons/1"]) {
    assert.equal(isPublicPath(path), false, path);
  }
});

test("ログイン前に必要な画面は公開", () => {
  for (const path of [
    "/login",
    "/password-reset",
    "/set-password",
    "/auth/confirm",
  ]) {
    assert.equal(isPublicPath(path), true, path);
  }
});

test("死活維持エンドポイントは公開（Cron は Cookie を持たない）", () => {
  assert.equal(isPublicPath("/api/keep-alive"), true);
});

test("進捗保存 API はログイン必須のまま", () => {
  assert.equal(isPublicPath("/api/progress"), false);
});

test("前方一致で別パスを巻き込まない", () => {
  assert.equal(isPublicPath("/logindanger"), false);
  assert.equal(isPublicPath("/api/keep-alive-secret"), false);
});
