-- ---------------------------------------------------------------------------
-- フリキャリ Phase 6-B: お知らせの既読管理
--
--   announcement_reads … どのユーザーがどのお知らせを読んだか
--
-- 方針
--   - Phase 5 の進捗テーブルと同じ形。複合主キー + auth.uid() = user_id の RLS
--   - 「読んだ」という事実だけを持つ。未読は「行が無い」で表現する
--   - 未読件数 = 公開済み件数 − 既読件数（アプリ側で算出）
-- ---------------------------------------------------------------------------

create table if not exists public.announcement_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

comment on table public.announcement_reads is
  'お知らせの既読。行が無い＝未読。未読件数はアプリ側で公開済み件数との差から求める。';

-- 未読件数の算出（自分の既読を全件引く）で使う
create index if not exists announcement_reads_user_idx
  on public.announcement_reads (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   自分の既読だけ。他人が何を読んだかは見えない。
-- ---------------------------------------------------------------------------
alter table public.announcement_reads enable row level security;

drop policy if exists "Users manage own announcement reads" on public.announcement_reads;
create policy "Users manage own announcement reads"
  on public.announcement_reads for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 権限
-- ---------------------------------------------------------------------------
revoke all on table public.announcement_reads from anon, authenticated;
grant select, insert, update, delete on table public.announcement_reads to authenticated;
