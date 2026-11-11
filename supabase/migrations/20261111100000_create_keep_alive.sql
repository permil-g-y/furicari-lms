-- ---------------------------------------------------------------------------
-- keep_alive: Supabase Free プランの自動一時停止を防ぐための空打ちクエリ
--
-- ■ なぜ必要か
--   Free プランのプロジェクトは「7 日間アクティビティが無い」と自動停止され、
--   停止中は DNS レコードごと消えるため、ログインを含む全ての通信が失敗する。
--   2026-11-11 に実際にこれが発生した（最終ログイン 2026-09-23 → 約 7 週間無通信）。
--
-- ■ なぜ専用の関数を作るのか
--   anon / service_role には public スキーマのテーブル権限を一切与えていない
--   （migration が authenticated にしか grant していない）。
--   そのため「ログインせずに Postgres へ到達できる口」が 1 つも無く、
--   既存エンドポイントへの定期アクセスでは DB を起こせない。
--   ここで作るのは now() を返すだけの関数で、
--   テーブルも auth スキーマも一切参照しない = 情報漏洩の余地が無い。
--
-- ■ security invoker である理由
--   now() は pg_catalog の関数なので anon の権限のままでも実行できる。
--   definer にする理由が無く、権限を広げないために invoker にしておく。
-- ---------------------------------------------------------------------------
create or replace function public.keep_alive()
returns timestamptz
language sql
volatile
security invoker
set search_path = ''
as $$
  select now();
$$;

comment on function public.keep_alive() is
  'Free プランの自動一時停止を防ぐための空打ちクエリ。now() のみを返す。';

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
