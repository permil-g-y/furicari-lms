# Supabase の適用手順

このディレクトリの SQL は、Supabase Dashboard の **SQL Editor** に貼り付けて実行します。

## 適用の順番

| # | ファイル | 内容 | 適用状況 |
|---|---|---|---|
| 1 | `migrations/20260819120000_create_profiles.sql` | profiles / RLS / 招待時トリガー | Phase 2 で適用済み |
| 2 | `migrations/20260819140000_create_content_tables.sql` | categories / tools / courses / chapters / lessons / user_course_enrollments と RLS | **未適用** |
| 3 | `seed/0001_content.sql` | 教材のダミーデータ（コース6 / チャプター25 / レッスン90） | **未適用** |

`2` を実行してから `3` を実行してください。

## 手順

1. Supabase Dashboard を開く
2. 左サイドバーの **「SQL Editor」** をクリック
3. **「New query」** をクリック
4. 上の表の **2** のファイルの中身をすべてコピーして貼り付け
5. 右下の **「Run」** をクリック → `Success` を確認
6. 同じ手順で **3** のファイルも実行

## 適用できたかの確認

```bash
node scripts/verify-content-db.mjs
```

すべてのテーブルが「✅ 存在し、匿名アクセスは拒否」になれば成功です。

## 再実行について

- マイグレーションは `create table if not exists` / `drop policy if exists` を使っており、**何度実行しても安全**です
- シードは slug をキーにした upsert なので**何度実行しても同じ状態**になります
  - ただし管理画面などで手編集した内容は上書きされる点に注意

## シードの再生成

シード SQL は `src/lib/mock` から自動生成しています。直接編集しないでください。

```bash
npx --yes tsx scripts/generate-content-seed.ts
```

## 未適用のときの挙動

マイグレーション未適用でもアプリは起動します。
`src/lib/content/server.ts` が `src/lib/mock` へフォールバックし、
サーバーログに警告を出します（開発を止めないための仕組みで、本番では使われません）。
