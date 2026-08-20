-- ---------------------------------------------------------------------------
-- フリキャリ Phase 4: Cloudflare Stream 接続テスト用の紐付け
--
-- テスト対象の 1 本だけに Video UID を設定する。
-- 他の 89 本は stream_video_id を NULL のまま維持し、
-- 従来どおりダミープレイヤーを表示させる。
--
-- 対象: Premiere Pro 実践コース / Chapter 2 / 05 カット編集の基本を身につける
--       slug = 'premiere-practice-05'
--
-- 冪等。何度実行しても同じ状態になる。
-- ---------------------------------------------------------------------------

update public.lessons
set stream_video_id = '79b36efc97c8e2e1cb4cdb5347833b05'
where slug = 'premiere-practice-05';

-- 念のため、他のレッスンに誤って Video UID が入っていないことを確認する。
-- （このテスト用 UID は 1 本だけに紐付いている状態が正しい）
do $$
declare
  linked_count integer;
begin
  select count(*) into linked_count
  from public.lessons
  where stream_video_id is not null;

  if linked_count <> 1 then
    raise warning
      'Phase 4 テスト: stream_video_id が入っているレッスンが % 本あります（想定は 1 本）', linked_count;
  else
    raise notice 'Phase 4 テスト: stream_video_id の紐付けは 1 本のみです（想定どおり）';
  end if;
end
$$;
