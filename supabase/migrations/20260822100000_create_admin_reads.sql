-- ---------------------------------------------------------------------------
-- Phase 7-B: 管理画面の「読み取り」に必要な最小限の追加
--
--   1. 受講生一覧のための auth.users への安全な到達手段
--   2. admin が受講生の学習状況を読めるようにする RLS ポリシーの **追加**
--
-- 受講生向けの既存ポリシーは 1 つも変更しない。
-- student から見える範囲はこの migration の前後で完全に同じ。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. 受講生一覧
--
-- ■ View 方式（security_invoker = true）は成立しないことを実測で確認済み
--
--     create view ... with (security_invoker = true) as select ... from auth.users
--     → authenticated ロールで SELECT すると
--       ERROR: permission denied for table users
--
--   auth.users の所有者は supabase_auth_admin で、authenticated には
--   SELECT 権限が無い。security_invoker = true は「呼び出し元の権限で評価する」
--   ため、権限が無いという事実がそのまま出る。
--
-- ■ security_invoker = false（既定）の View も採らない
--
--   動きはするが、View が PostgREST 経由で公開スキーマに露出するため、
--   auth.users をテーブルとして API に晒すことになる。
--   Supabase のセキュリティ検査でも警告される構成。
--
-- ■ 採用: SECURITY DEFINER 関数
--
--   - 関数なので PostgREST に「テーブル」として露出しない
--   - is_admin() でない場合は **例外を投げて落とす**（黙って 0 件返さない）
--   - set search_path = '' で search_path 経由の乗っ取りを防ぐ
--   - anon には execute を与えない
--   - profiles を起点に join するため、profiles に行が無いユーザーは出てこない
--     （= アプリが知らないユーザーが混ざらない）
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_students()
returns table (
  id uuid,
  email text,
  display_name text,
  role public.user_role,
  notification_enabled boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  invited_at timestamptz,
  email_confirmed_at timestamptz,
  banned_until timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- 認可は「絞り込み」ではなく「拒否」で行う。
  -- where 句で 0 件にする書き方だと、条件を書き忘れた瞬間に全件漏れる。
  if not public.is_admin() then
    raise exception 'admin_list_students: forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.role,
    p.notification_enabled,
    p.created_at,
    u.last_sign_in_at,
    u.invited_at,
    u.email_confirmed_at,
    u.banned_until
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.deleted_at is null
  order by p.created_at;
end;
$$;

revoke all on function public.admin_list_students() from public, anon;
grant execute on function public.admin_list_students() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. 学習状況の参照
--
--   既存の「本人のみ」ポリシーはそのまま残し、admin 用の SELECT を **足す**。
--   PostgreSQL の RLS は複数ポリシーを OR で評価するため、
--   受講生から見える範囲は変わらない。
--
--   admin に与えるのは SELECT だけ。
--   他人の進捗を書き換える必要はどこにも無いため。
-- ---------------------------------------------------------------------------
drop policy if exists "Admins read all progress" on public.lesson_progress;
create policy "Admins read all progress"
  on public.lesson_progress for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins read all view events" on public.lesson_view_events;
create policy "Admins read all view events"
  on public.lesson_view_events for select to authenticated
  using ((select public.is_admin()));
