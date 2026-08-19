-- ---------------------------------------------------------------------------
-- フリキャリ Phase 3: 教材コンテンツのテーブル
--
--   categories / tools / courses / chapters / lessons
--   + user_course_enrollments（受講権限。Phase 6 以降で有効化する土台）
--
-- 方針
--   - 主キーは uuid、URL とシードの安定性のために slug を別途 unique で持つ
--   - 学習進捗（視聴済み本数・進捗率など）はこのマイグレーションに含めない。
--     教材＝ここ、進捗＝Phase 5 の lesson_progress、という境界を明確にする
--   - 管理画面（Phase 7）から CRUD できるよう is_published / sort_order を全テーブルに用意
-- ---------------------------------------------------------------------------

-- 難易度。profiles の user_role と同じく enum で持つ。
do $$
begin
  if not exists (select 1 from pg_type where typname = 'content_level') then
    create type public.content_level as enum ('beginner', 'intermediate', 'advanced');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 共通: updated_at 自動更新
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 管理者判定
--   RLS ポリシーから profiles を直接参照すると再帰するため、
--   SECURITY DEFINER 関数で判定する。
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is '教材カテゴリ（動画編集 / AI活用 など）。slug は UI のフィルタ値と一致させる。';

-- ---------------------------------------------------------------------------
-- tools
--   サムネイルのグラデーションは Claude Design のデザイン仕様なので DB で持つ。
-- ---------------------------------------------------------------------------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  badge text not null,
  gradient_from text not null,
  gradient_to text not null,
  ink text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tools is '使用ツール。badge / gradient / ink は動画サムネイルの描画に使う。';

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  -- コース詳細ページ用の長い説明（無ければ description を使う）
  long_description text,
  category_id uuid references public.categories (id) on delete set null,
  level public.content_level not null default 'beginner',
  -- カバーはアイコン + パステル背景で表現される（画像ではない）
  cover_bg_color text not null default '#EAF4FF',
  cover_icon text,
  cover_text text,
  cover_text_color text,
  -- 「約6時間」のような編集者が決める表示用ラベル
  duration_label text not null default '',
  -- 「このコースで学べること」 [{title, note}]
  learn_points jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.courses is 'コース。受講済み本数・進捗率は持たない（進捗は Phase 5 の別テーブル）。';

create index if not exists courses_category_id_idx on public.courses (category_id);
create index if not exists courses_sort_order_idx on public.courses (sort_order);

-- ---------------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null unique,
  -- 「Chapter 2」の 2。並び順とは別に表示番号として持つ
  number integer not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chapters is 'コース内のチャプター。';

create index if not exists chapters_course_id_idx on public.chapters (course_id, sort_order);

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  course_id uuid not null references public.courses (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  -- カリキュラム上の通し番号（"05" とゼロ埋め表示する）
  number integer not null,
  title text not null,
  description text,
  -- 「この動画について」の箇条書き
  key_points jsonb not null default '[]'::jsonb,
  -- Phase 4 で Cloudflare Stream の Video UID を入れる。NULL の間はダミープレイヤー
  stream_video_id text,
  duration_seconds integer not null default 0,
  tool_id uuid references public.tools (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  level public.content_level not null default 'beginner',
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lessons is 'レッスン（動画）。stream_video_id が入ると Cloudflare Stream 再生へ切り替わる。';

create index if not exists lessons_course_id_idx on public.lessons (course_id, sort_order);
create index if not exists lessons_chapter_id_idx on public.lessons (chapter_id, sort_order);
create index if not exists lessons_published_at_idx on public.lessons (published_at desc);

-- ---------------------------------------------------------------------------
-- user_course_enrollments
--   受講権限。「生徒Aは Premiere Pro のみ」「生徒Bは Premiere Pro + AI」を
--   将来表現するためのテーブル。
--
--   Phase 3 時点ではコンテンツの SELECT ポリシーをこのテーブルで絞らない。
--   （現在のテストユーザーが既存ダミーコースを閲覧できる状態を維持するため）
--   Phase 6 以降でポリシーを差し替えるだけで受講制御を有効化できる。
-- ---------------------------------------------------------------------------
create table if not exists public.user_course_enrollments (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  -- 期限付き受講に備える。NULL は無期限
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

comment on table public.user_course_enrollments is
  '受講権限。Phase 3 では閲覧制御に使わず、Phase 6 以降でコンテンツ RLS を差し替える前提の土台。';

create index if not exists user_course_enrollments_course_id_idx
  on public.user_course_enrollments (course_id);

-- ---------------------------------------------------------------------------
-- updated_at トリガー
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'tools', 'courses', 'chapters', 'lessons']
  loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format(
      'create trigger touch_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
--   student : 公開済みコンテンツのみ SELECT 可能
--   admin   : 全件 SELECT + CRUD 可能（管理画面は Phase 7 だが RLS は今から有効）
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.tools enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.user_course_enrollments enable row level security;

-- カテゴリ・ツールは公開/非公開の概念を持たないマスタなので認証済みなら参照可
drop policy if exists "Authenticated can read categories" on public.categories;
create policy "Authenticated can read categories"
  on public.categories for select to authenticated using (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Authenticated can read tools" on public.tools;
create policy "Authenticated can read tools"
  on public.tools for select to authenticated using (true);

drop policy if exists "Admins manage tools" on public.tools;
create policy "Admins manage tools"
  on public.tools for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- コース: 公開済みのみ。admin は非公開も見える
drop policy if exists "Authenticated can read published courses" on public.courses;
create policy "Authenticated can read published courses"
  on public.courses for select to authenticated
  using (is_published or (select public.is_admin()));

drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses"
  on public.courses for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- チャプター: 親コースが公開されていること
drop policy if exists "Authenticated can read chapters of published courses" on public.chapters;
create policy "Authenticated can read chapters of published courses"
  on public.chapters for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.is_published
    )
  );

drop policy if exists "Admins manage chapters" on public.chapters;
create policy "Admins manage chapters"
  on public.chapters for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- レッスン: レッスン自身が公開 かつ 親コースが公開
drop policy if exists "Authenticated can read published lessons" on public.lessons;
create policy "Authenticated can read published lessons"
  on public.lessons for select to authenticated
  using (
    (select public.is_admin())
    or (
      is_published
      and exists (
        select 1 from public.courses c
        where c.id = lessons.course_id and c.is_published
      )
    )
  );

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons"
  on public.lessons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 受講権限: 本人は自分の受講状況のみ参照可。付与・剥奪は admin のみ
drop policy if exists "Users can read own enrollments" on public.user_course_enrollments;
create policy "Users can read own enrollments"
  on public.user_course_enrollments for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "Admins manage enrollments" on public.user_course_enrollments;
create policy "Admins manage enrollments"
  on public.user_course_enrollments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 権限
--   student が UPDATE/DELETE できないよう、SELECT 以外は付与しない。
--   admin の CRUD は上記ポリシー + ここでの権限付与で成立させる。
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'tools', 'courses', 'chapters', 'lessons', 'user_course_enrollments']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end
$$;
