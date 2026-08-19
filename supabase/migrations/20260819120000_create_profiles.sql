-- ---------------------------------------------------------------------------
-- フリキャリ Phase 2: profiles テーブル / RLS / トリガー
--
-- auth.users（Supabase Auth 管理）とは別に、アプリ側で扱うプロフィールを持つ。
-- 招待制 LMS のため、profiles はユーザー自身では作成できず、
-- auth.users への INSERT をトリガーにして自動生成する。
-- ---------------------------------------------------------------------------

-- 役割。当面は student / admin の 2 種類。
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'admin');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'student',
  notification_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'フリキャリ受講生・運営のプロフィール。auth.users と 1:1。';
comment on column public.profiles.display_name is '表示名。招待直後は NULL になり得るためアプリ側でフォールバックする。';
comment on column public.profiles.role is '権限。本人からは変更できない（列権限 + トリガーで保護）。';

-- ---------------------------------------------------------------------------
-- Row Level Security
--   student は「自分の profile だけ」参照・更新できる。
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- INSERT / DELETE のポリシーは意図的に作らない。
-- profiles の作成は auth.users のトリガー経由のみ、削除は cascade のみ。

-- ---------------------------------------------------------------------------
-- 列レベル権限
--   role を UPDATE の対象から外し、権限昇格を SQL レベルで不可能にする。
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, notification_enabled) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 変更させたくない列を強制的に元の値へ戻すトリガー（多層防御）
--   SECURITY INVOKER のままにして、current_user で呼び出し元ロールを判定する。
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  -- 管理系ロール（Secret key 経由 / マイグレーション）は制限しない
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    new.updated_at := now();
    return new;
  end if;

  new.id := old.id;
  new.role := old.role;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- auth.users 作成時に profiles を自動生成する
--   招待（inviteUserByEmail）でも同じ経路を通る。
--   ここで例外を投げると Auth ユーザーの作成自体が失敗するため、
--   失敗しても警告に留めて Auth 側を巻き添えにしない。
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    insert into public.profiles (id, display_name, avatar_url)
    values (
      new.id,
      nullif(
        trim(
          coalesce(
            new.raw_user_meta_data ->> 'display_name',
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name',
            ''
          )
        ),
        ''
      ),
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
    )
    on conflict (id) do nothing;
  exception
    when others then
      raise warning 'handle_new_user: profiles の作成に失敗しました (user_id=%): %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 既存ユーザーのバックフィル（トリガー導入前に作られたユーザー向け）
-- ---------------------------------------------------------------------------
insert into public.profiles (id)
select u.id
from auth.users u
on conflict (id) do nothing;
