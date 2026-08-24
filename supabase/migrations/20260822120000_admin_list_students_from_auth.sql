-- ---------------------------------------------------------------------------
-- Phase 7-D: 招待した受講生が必ず一覧に出るようにする
--
-- ■ なぜ変えるか
--   admin_list_students() は profiles を起点に auth.users を join していた。
--   profiles は on_auth_user_created トリガーで自動作成されるが、
--   このトリガーは失敗しても警告に留めて Auth 側を巻き添えにしない設計になっている
--   （招待そのものが失敗するほうが実害が大きいため。これは正しい）。
--
--   結果として「Auth ユーザーは居るが profiles が無い」状態が起こり得る。
--   その人は一覧に出ず、**管理画面から復旧できなくなる**。
--   招待の部分失敗から必ず復旧できることを優先し、起点を auth.users に変える。
--
--   role は profiles にしか無いため、行が無い場合は既定値の 'student' として扱う。
--   （権限を勝手に強くしないほうへ倒す）
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
  if not public.is_admin() then
    raise exception 'admin_list_students: forbidden' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    p.display_name,
    coalesce(p.role, 'student'::public.user_role),
    coalesce(p.notification_enabled, true),
    coalesce(p.created_at, u.created_at),
    u.last_sign_in_at,
    u.invited_at,
    u.email_confirmed_at,
    u.banned_until
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.deleted_at is null
  order by coalesce(p.created_at, u.created_at);
end;
$$;

revoke all on function public.admin_list_students() from public, anon;
grant execute on function public.admin_list_students() to authenticated;
