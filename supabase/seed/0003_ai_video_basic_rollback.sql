-- !! 取り消し用。通常の運用では実行しないこと。!!
-- AI動画編集基礎(半自動) の投入をなかったことにする。
--
-- 影響範囲はこのコースのみ。他コース・他レッスンには触れない。
-- ただし、このコースのレッスンに付いた受講生の進捗は
-- lessons の削除に連動して消える（on delete cascade）。
-- Cloudflare 上の動画は消えないので、再投入すれば同じ uid で繋がる。

begin;

delete from public.lessons where slug like 'ai-video-basic-%';
delete from public.chapters where slug like 'ai-video-basic-ch%';
delete from public.courses where slug = 'ai-video-basic';

commit;
