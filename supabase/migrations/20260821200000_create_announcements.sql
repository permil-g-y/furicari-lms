-- ---------------------------------------------------------------------------
-- フリキャリ Phase 6-A: お知らせ
--
--   announcements … 受講生向けのお知らせ本体
--
-- 方針
--   - 本文は jsonb（AnnouncementBlock[]）。画面がすでに
--     paragraph / heading / callout のブロック構造で描いているため、
--     同じ形をそのまま持てば詳細ページの JSX を変えずに済む
--   - 公開制御は is_published と published_at の 2 つで行う。
--     「下書き」と「予約公開」を 1 つの仕組みで表現できる
--   - 配信範囲は全体配信のみ。ユーザー単位 / コース単位の配信が必要になったら
--     target_course_id uuid null を 1 列足すだけで拡張できる（NULL = 全体）
--   - NEW バッジはデータに持たせず published_at から算出する（アプリ側）
-- ---------------------------------------------------------------------------

-- お知らせの種別。バッジの配色はアプリ側が持つ。
do $$
begin
  if not exists (select 1 from pg_type where typname = 'announcement_category') then
    create type public.announcement_category as enum
      ('new_course', 'event', 'update', 'maintenance');
  end if;
end
$$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  -- URL を安定させるための識別子（ann-01 等）。教材の slug と同じ考え方
  slug text not null unique,
  title text not null,
  category public.announcement_category not null,
  -- AnnouncementBlock[] をそのまま保持する
  body jsonb not null default '[]'::jsonb,
  -- 詳細ページ下部の関連リンク [{icon, label, href}]
  related_links jsonb not null default '[]'::jsonb,
  -- 公開日時。未来の日時なら予約公開として扱う
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.announcements is
  'お知らせ。全体配信のみ。ユーザー / コース単位の配信は target_course_id を足して拡張する。';

comment on column public.announcements.body is
  'AnnouncementBlock[]（paragraph / heading / callout）。画面の描画構造と 1:1。';

comment on column public.announcements.published_at is
  '公開日時。未来日は予約公開。NEW バッジもこの値から算出する。';

-- 一覧は公開日の新しい順
create index if not exists announcements_published_idx
  on public.announcements (published_at desc);

-- ---------------------------------------------------------------------------
-- updated_at トリガー（Phase 3 で定義済みの共通関数を再利用）
-- ---------------------------------------------------------------------------
drop trigger if exists touch_updated_at on public.announcements;
create trigger touch_updated_at
  before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
--   受講生 : 公開済み かつ 公開日時を過ぎたものだけ
--   admin  : 下書き・予約分も含めて全件、CRUD 可
-- ---------------------------------------------------------------------------
alter table public.announcements enable row level security;

drop policy if exists "Authenticated can read published announcements" on public.announcements;
create policy "Authenticated can read published announcements"
  on public.announcements for select to authenticated
  using (
    (is_published and published_at <= now())
    or (select public.is_admin())
  );

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 権限
--   匿名からは一切触れない。受講生の閲覧範囲は上記 RLS が決める。
-- ---------------------------------------------------------------------------
revoke all on table public.announcements from anon, authenticated;
grant select, insert, update, delete on table public.announcements to authenticated;
