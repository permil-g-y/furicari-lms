# Supabase の適用手順

このディレクトリの SQL は、Supabase Dashboard の **SQL Editor** に貼り付けて実行します。

## 適用の順番

| # | ファイル | 内容 | 適用状況 |
|---|---|---|---|
| 1 | `migrations/20260819120000_create_profiles.sql` | profiles / RLS / 招待時トリガー | Phase 2 で適用済み |
| 2 | `migrations/20260819140000_create_content_tables.sql` | categories / tools / courses / chapters / lessons / user_course_enrollments と RLS | Phase 3 で適用済み |
| 3 | `seed/0001_content.sql` | 教材のダミーデータ（コース6 / チャプター25 / レッスン90） | Phase 3 で適用済み |
| 4 | `migrations/20260820100000_link_test_stream_video.sql` | テスト動画 1 本の `stream_video_id` 紐付け | Phase 4 で適用済み |
| 5 | `migrations/20260821100000_create_progress_tables.sql` | lesson_progress / lesson_view_events / lesson_favorites / course_favorites と RLS | Phase 5 で適用済み |
| 6 | `migrations/20260821200000_create_announcements.sql` | announcements と RLS | Phase 6 で適用済み |
| 7 | `seed/0002_announcements.sql` | お知らせのシード（本文を持つ 1 件のみ） | Phase 6 で適用済み |
| 8 | `migrations/20260821210000_create_announcement_reads.sql` | announcement_reads と RLS | Phase 6 で適用済み |

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


## 受講権限の付与（Phase 6-E 以降で必須）

Phase 6-E から、**受講権限が無いコースの動画は再生できません**。
コース名・カリキュラムは閲覧できますが、`/watch/[lessonId]` はサーバー側で拒否されます。

### 新しく招待した受講生に権限を付与する

管理画面（Phase 7）ができるまでは SQL Editor から付与します。

```sql
-- 特定のユーザーへ全公開コースを無期限で付与する
insert into public.user_course_enrollments (user_id, course_id, expires_at)
select u.id, c.id, null
from auth.users u
cross join public.courses c
where u.email = 'ここに受講生のメールアドレス'
  and c.is_published
on conflict (user_id, course_id) do nothing;
```

```sql
-- 特定のコースだけを付与する場合
insert into public.user_course_enrollments (user_id, course_id, expires_at)
select u.id, c.id, null
from auth.users u, public.courses c
where u.email = 'ここに受講生のメールアドレス'
  and c.slug = 'premiere-practice'
on conflict (user_id, course_id) do nothing;
```

```sql
-- 期限付きで付与する場合（expires_at を入れるだけ）
--   NULL          … 無期限
--   未来の日時    … その日時まで有効
--   過去の日時    … 期限切れ（再生できない）
insert into public.user_course_enrollments (user_id, course_id, expires_at)
select u.id, c.id, '2027-03-31T23:59:59+09:00'::timestamptz
from auth.users u, public.courses c
where u.email = 'ここに受講生のメールアドレス'
  and c.slug = 'ai-editing'
on conflict (user_id, course_id) do update set expires_at = excluded.expires_at;
```

### 付与状況の確認

```sql
select u.email, c.slug, e.expires_at
from public.user_course_enrollments e
join auth.users u on u.id = e.user_id
join public.courses c on c.id = e.course_id
order by u.email, c.slug;
```

> ⚠️ **受講権限を先に配ってから制限を有効にすること。**
> 順序を逆にすると、権限を持たないユーザーが一斉に動画を再生できなくなります。

### 管理者

`profiles.role = 'admin'` のユーザーは受講権限に関係なく全コースを再生できます。
role は受講生自身からは変更できないよう二層で保護されているため、
変更は SQL Editor から行ってください。
