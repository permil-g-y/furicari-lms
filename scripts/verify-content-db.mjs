/**
 * Supabase に Phase 3 のテーブルとシードが入っているかを確認する。
 *
 *   node scripts/verify-content-db.mjs
 *
 * 匿名キーでアクセスするため RLS により行は読めない。
 * そのかわり PostgREST のエラーコードで状態を判別する。
 *
 *   PGRST205 … テーブルが存在しない        → マイグレーション未適用
 *   42501    … 権限がない（＝テーブルは在る）→ マイグレーション適用済み
 *   200      … 読めてしまう                 → RLS が効いていない（要調査）
 */

import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY が .env.local にありません");
  process.exit(1);
}

const tables = [
  "profiles",
  "categories",
  "tools",
  "courses",
  "chapters",
  "lessons",
  "user_course_enrollments",
];

let allPresent = true;

for (const table of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const body = await res.text();

  let verdict;
  if (res.status === 200) {
    verdict = "⚠️  匿名で読めてしまう（RLS を確認）";
    allPresent = allPresent && true;
  } else if (body.includes("PGRST205") || body.includes("Could not find the table")) {
    verdict = "❌ テーブルが存在しない（マイグレーション未適用）";
    allPresent = false;
  } else if (body.includes("42501") || res.status === 401 || res.status === 403) {
    verdict = "✅ 存在し、匿名アクセスは拒否（想定どおり）";
  } else {
    verdict = `? HTTP ${res.status} ${body.slice(0, 80)}`;
  }

  console.log(`${table.padEnd(24)} ${verdict}`);
}

console.log("");
console.log(
  allPresent
    ? "→ テーブルは揃っています。行数の確認はログイン済みブラウザから行ってください。"
    : "→ supabase/migrations の SQL を Supabase の SQL Editor で実行してください。",
);
