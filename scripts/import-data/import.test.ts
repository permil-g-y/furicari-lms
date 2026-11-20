import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDurationLabel, stripCode, extractCode } from "./plan";

/**
 * 学習時間ラベルとタイトル整形は、受講生の画面にそのまま出る。
 * 一度決めた見せ方がコースを追加するたびにぶれないよう、ここで固定する。
 */

test("学習時間は 15 分単位に丸めて時間+分で出す", () => {
  assert.equal(formatDurationLabel(89 * 60 + 10), "約1時間30分"); // 今回のコース
  assert.equal(formatDurationLabel(60 * 60), "約1時間");
  assert.equal(formatDurationLabel(6 * 3600), "約6時間"); // 既存コースの見え方を崩さない
  assert.equal(formatDurationLabel(6 * 3600 + 5 * 60), "約6時間");
  assert.equal(formatDurationLabel(45 * 60), "約45分");
});

test("尺が無いときはラベルを作らない（捏造しない）", () => {
  assert.equal(formatDurationLabel(0), "");
  assert.equal(formatDurationLabel(-1), "");
});

test("極端に短くても 0 分にはしない", () => {
  assert.equal(formatDurationLabel(30), "約15分");
});

test("管理番号を落とす（区切りの有無を問わない）", () => {
  assert.equal(stripCode("1-1-1.従来の動画編集の基本的な流れを確認しよう"), "従来の動画編集の基本的な流れを確認しよう");
  // シートには区切りのドットが無い行もある
  assert.equal(stripCode("4-1-1スクリーンショットを使ってAIに問題を伝えてみよう"), "スクリーンショットを使ってAIに問題を伝えてみよう");
  assert.equal(stripCode("10-2-3．全角ドットの場合"), "全角ドットの場合");
});

test("タイトル中の数字を管理番号と誤認しない", () => {
  assert.equal(stripCode("ショート動画を3本作ろう"), "ショート動画を3本作ろう");
});

test("管理番号の抽出は先頭の 3 連番だけを見る", () => {
  assert.equal(extractCode("2-1-1.タイトル"), "2-1-1");
  assert.equal(extractCode("4-1-1タイトル"), "4-1-1");
  assert.equal(extractCode("タイトルのみ"), null);
});
