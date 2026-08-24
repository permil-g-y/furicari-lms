import assert from "node:assert/strict";
import { test } from "node:test";

import { describeOutcome, normalizeEmail, validateEmail } from "./invite";

/**
 * 招待メールは取り消せない。
 * ここで固定したいのは「部分失敗を成功で塗りつぶさないこと」。
 */

test("前後の空白を落として小文字に揃える", () => {
  assert.equal(normalizeEmail("  Foo@Example.COM  "), "foo@example.com");
});

test("明らかな打ち間違いは送る前に弾く", () => {
  assert.equal(validateEmail("").ok, false);
  assert.equal(validateEmail("   ").ok, false);
  assert.equal(validateEmail("foo").ok, false);
  assert.equal(validateEmail("foo@bar").ok, false, "TLD が無い");
  assert.equal(validateEmail("foo bar@example.com").ok, false, "空白入り");
});

test("通常のアドレスは通す", () => {
  const result = validateEmail("Student+tag@Example.co.jp");
  assert.deepEqual(result, { ok: true, email: "student+tag@example.co.jp" });
});

test("新規招待＋権限付与が両方成功したとき", () => {
  const { tone, message } = describeOutcome({
    kind: "invited",
    userId: "u1",
    email: "a@example.com",
    grantedCourses: ["Premiere Pro 実践コース", "CapCut 実践コース"],
    failedCourses: [],
  });
  assert.equal(tone, "success");
  assert.match(message, /招待メールを送り/);
  assert.match(message, /2 コース/);
});

test("招待は成功したが権限付与に失敗したら warning にする", () => {
  const { tone, message } = describeOutcome({
    kind: "invited",
    userId: "u1",
    email: "a@example.com",
    grantedCourses: [],
    failedCourses: ["CapCut 実践コース"],
  });
  assert.equal(tone, "warning", "成功で塗りつぶさない");
  assert.match(message, /招待メールを送りました/, "招待自体は成功したと伝える");
  assert.match(message, /CapCut 実践コース/, "どのコースが失敗したかを名指しする");
  assert.match(message, /付与し直して/, "復旧の導線を示す");
});

test("既に登録済みなら招待はせず権限だけ付ける", () => {
  const { tone, message } = describeOutcome({
    kind: "existing_granted",
    userId: "u1",
    email: "a@example.com",
    grantedCourses: ["AI動画編集 効率化コース"],
    failedCourses: [],
  });
  assert.equal(tone, "success");
  assert.match(message, /既に登録済み/);
  assert.doesNotMatch(message, /招待メールを送/, "送っていないのに送ったと言わない");
});

test("登録済みでコース未選択なら、何も変えていないと伝える", () => {
  const { message } = describeOutcome({
    kind: "existing_granted",
    userId: "u1",
    email: "a@example.com",
    grantedCourses: [],
    failedCourses: [],
  });
  assert.match(message, /変更していません/);
});

test("コース未選択の招待は、権限が未設定であることを明示する", () => {
  const { message } = describeOutcome({
    kind: "invited",
    userId: "u1",
    email: "a@example.com",
    grantedCourses: [],
    failedCourses: [],
  });
  assert.match(message, /まだ設定されていません/);
});
