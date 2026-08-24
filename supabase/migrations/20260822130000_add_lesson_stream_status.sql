-- ---------------------------------------------------------------------------
-- Phase 7-E: 動画の処理状態を持つ
--
-- ■ なぜ必要か
--   Direct Creator Upload は **URL を発行した時点で uid が確定する**ため、
--   その瞬間に lessons.stream_video_id を書ける（照合処理が要らない）。
--   ただしアップロードが中断されると
--   「uid はあるが動画が無い」状態が残る。
--   それを表現できないと、再生できない動画が公開されてしまう。
--
-- ■ CHECK 制約を入れない理由（REVIEW 03）
--   条件自体は書ける:
--     check (not is_published or stream_video_id is null or stream_status = 'ready')
--   テキスト教材（stream_video_id is null）も通るので、そこは問題にならない。
--
--   採らないのは、**公開中の動画が後から壊れたときに真実を記録できなくなる**ため。
--   Cloudflare 同期が ready → error を検出したとき、対象が公開中だと
--   CHECK に弾かれて同期処理そのものが失敗する。
--   DB が「実際に起きたこと」を記録できないのは、守るどころか状況を悪化させる。
--
--   代わりに
--     1. 公開時の検証は Server Action で行う（UI ではなくサーバー側）
--     2. 同期が ready 以外を検出したら自動的に非公開へ落とす
--     3. ダッシュボードの「要対応」に出す
--   とする。
--
--   なお現在 90 レッスンすべてが is_published = true で、うち 89 本は動画なし。
--   素朴な CHECK を入れると既存の 89 行が違反になる。
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stream_status') then
    create type public.stream_status as enum ('pending', 'ready', 'error');
  end if;
end $$;

alter table public.lessons
  add column if not exists stream_status public.stream_status,
  add column if not exists stream_synced_at timestamptz,
  -- Cloudflare が返した失敗理由。運営が原因を見て判断できるようにする
  add column if not exists stream_error text;

-- 既に再生できている動画は ready として扱う。
-- （Phase 4 で実際に再生を確認済みの 1 本）
update public.lessons
set stream_status = 'ready'
where stream_video_id is not null
  and stream_status is null;

comment on column public.lessons.stream_status is
  '動画の処理状態。stream_video_id が null のレッスン（テキスト教材など）では null。';
