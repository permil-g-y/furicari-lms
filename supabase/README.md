# Supabase の適用手順

このディレクトリの SQL は、Supabase Dashboard の **SQL Editor** に貼り付けて実行します。

## 適用の順番

| # | ファイル | 内容 | 適用状況 |
|---|---|---|---|
| 1 | `migrations/20260819120000_create_profiles.sql` | profiles / RLS / 招待時トリガー | Phase 2 で適用済み |
| 2 | `migrations/20260819140000_create_content_tables.sql` | categories / tools / courses / chapters / lessons / user_course_enrollments と RLS | Phase 3 で適用済み |
| 3 | `seed/0001_content.sql` | 教材のダミーデータ（コース6 / チャプター25 / レッスン90） | Phase 3 で適用済み |
| 4 | `migrations/20260820100000_link_test_stream_video.sql` | テスト動画 1 本の `stream_video_id` 紐付け | Phase 4 で適用済み |
| 5 | `migrations/20260821100000_create_progress_tables.sql` | lesson_progress / lesson_view_events / lesson_favorites / course_favorites と RLS | **未適用** |

番号の順に実行してください。`3` は `2` に依存し、`4` は `3` に依存します。

## 手順

1. Supabase Dashboard を開く
2. 左サイドバーの **「SQL Editor」** をクリック
3. **「New query」** をクリック
4. 上の表の未適用のファイルの中身をすべてコピーして貼り付け
5. 右下の **「Run」** をクリック → `Success` を確認
6. 未適用のものが複数あれば、番号の順に同じ手順を繰り返す

## 適用できたかの確認

```bash
node scripts/verify-content-db.mjs
```

すべてのテーブルが「✅ 存在し、匿名アクセスは拒否」になれば成功です。

## 再実行について

- マイグレーションは `create table if not exists` / `drop policy if exists` を使っており、**何度実行しても安全**です
- シードは slug をキーにした upsert なので**何度実行しても同じ状態**になります
  - ただし管理画面などで手編集した内容は上書きされる点に注意
  - ⚠️ シードは `stream_video_id` を常に `null` で生成します。**再実行するとテスト動画の紐付けが消える**ため、
    その場合は `migrations/20260820100000_link_test_stream_video.sql` を再度実行してください
  - 学習進捗のテーブル（`lesson_progress` など）はシードの対象外なので、再実行しても進捗は消えません

## シードの再生成

シード SQL は `src/lib/mock` から自動生成しています。直接編集しないでください。

```bash
npx --yes tsx scripts/generate-content-seed.ts
```

## 未適用のときの挙動

マイグレーション未適用でもアプリは起動します。
`src/lib/content/server.ts` が `src/lib/mock` へフォールバックし、
サーバーログに警告を出します（開発を止めないための仕組みで、本番では使われません）。
