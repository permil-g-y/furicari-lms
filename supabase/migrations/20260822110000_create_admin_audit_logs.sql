-- ---------------------------------------------------------------------------
-- Phase 7-C: 最低限の監査ログ
--
-- 目的は「監査ログ画面を作ること」ではない。
-- 問い合わせ調査のときに
--     誰が / いつ / 何に対して / 何をしたか
-- が後から分かれば十分。閲覧 UI は Phase 7 の対象外。
--
-- 記録する操作（運営が「変えた」もの）
--   enrollment.grant / enrollment.revoke / enrollment.update_expiry
--   user.invite
--   lesson.publish / lesson.unpublish
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),

  -- 実行した管理者。
  -- 退職などでユーザーが消えてもログは残す必要があるため set null にし、
  -- 誰だったかは actor_email に写しておく（ログの価値は「後から分かる」ことにある）。
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text not null,

  action text not null,
  target_type text not null,
  -- 対象が uuid で表せないもの（コースの slug など）は detail に入れる
  target_id uuid,
  target_label text,

  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_target_idx
  on public.admin_audit_logs (target_type, target_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- append-only
--
--   RLS のポリシーではなく **権限**で落とす。
--   ポリシーは書き忘れれば緩むが、UPDATE / DELETE を grant しなければ
--   ポリシーの有無に関係なく書き換えられない。
--
--   認証済みロールへ与えるのは INSERT と SELECT だけ。
--   （運営が自分に不都合なログを消せてしまっては監査にならない）
-- ---------------------------------------------------------------------------
revoke all on table public.admin_audit_logs from authenticated, anon;
grant select, insert on table public.admin_audit_logs to authenticated;

drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs"
  on public.admin_audit_logs for select to authenticated
  using ((select public.is_admin()));

-- 自分以外の名前で書き込めないようにする（なりすまし防止）
drop policy if exists "Admins write audit logs" on public.admin_audit_logs;
create policy "Admins write audit logs"
  on public.admin_audit_logs for insert to authenticated
  with check ((select public.is_admin()) and actor_id = (select auth.uid()));
