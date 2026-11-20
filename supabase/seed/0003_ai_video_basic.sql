-- !! このファイルは scripts/import-course.ts が生成します。直接編集しないでください。!!
-- 生成元: スプレッドシート 1kcIOrgVOy2PP3h5wgInSOu5CmszxDS01PhGPEwiDwdI / Drive 1Ouf8nLeGuPCPwSzy7aqZxL1WV6NkigjD
--
-- slug を鍵にした upsert のみ。delete は含まない。
-- 既存の他コース・受講生の進捗には一切触れない。

begin;

-- 参照先の存在確認。足りなければ何も入れずに中断する。
do $$
begin
  if not exists (select 1 from public.categories where slug = 'ai') then
    raise exception 'categories.slug = % が存在しません', 'ai';
  end if;
  if (select count(*) from public.tools where slug in ('claude', 'premiere')) <> 2 then
    raise exception 'tools の slug が揃っていません';
  end if;
end $$;

-- コース
insert into public.courses
  (slug, title, description, category_id, level, cover_bg_color, cover_icon, duration_label, is_published, sort_order)
values
  ('ai-video-basic', 'AI動画編集基礎(半自動)', '自動字幕・要約・素材生成などのAIツールで、編集時間を大きく短縮します。', (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   '#F0EEFF', 'icon-sparkle-cluster', '約1時間30分', true, 7)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  duration_label = excluded.duration_label,
  sort_order = excluded.sort_order,
  updated_at = now();

-- チャプター
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch1', 1, 'AIで動画編集はどう変わるのか', 1)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch2', 2, 'フィラーワードを自動で削除しよう', 2)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch3', 3, 'SRT字幕をAIでまとめて修正しよう', 3)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch4', 4, 'Premiere Proで詰まったらClaudeに聞こう', 4)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch5', 5, '参考動画をAIで分解して構成をつかもう', 5)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch6', 6, 'AIに自分の動画編集を評価してもらおう', 6)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch7', 7, 'AIを使って納品前チェックをしよう', 7)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch8', 8, 'SNS向けに聞きやすい音量へ整えよう', 8)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();
insert into public.chapters (course_id, slug, number, title, sort_order)
values ((select id from public.courses where slug = 'ai-video-basic'), 'ai-video-basic-ch9', 9, 'サムネイル候補をAIに選んでもらおう', 9)
on conflict (slug) do update set
  course_id = excluded.course_id,
  number = excluded.number,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = now();

-- レッスン
-- [1-1-1] 動画なし（未納品）
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-01', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch1'),
   1, '従来の動画編集の基本的な流れを確認しよう', '素材確認・カット・テロップ・音量調整・書き出しなど、一般的な動画編集の流れを整理する',
   null, 0,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 1, null)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [1-1-2] 動画なし（未納品）
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-02', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch1'),
   2, 'AIで効率化できる編集工程を知ろう', '素材整理・カット・字幕修正・構成分析・編集チェックなど、AIを活用できる工程の全体像を確認する',
   null, 0,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 2, null)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [2-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-03', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch2'),
   3, 'Premiere Proでフィラーワードと語間を検出して削除しよう', 'Premiere Proの文字起こしとテキストベース編集を使い、フィラーワードや不要な間を見つけて削除する',
   '437a238508e5f572b150163742fa8f97', 303,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 3, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [2-1-2] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-04', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch2'),
   4, '自動カット後の不自然な部分を整えよう', '削除後のタイムラインを再生し、不自然な間やつながりをPremiere Proで調整する',
   '9ca92f55c4fd2bec0197116d57a838ff', 433,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 4, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [3-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-05', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch3'),
   5, 'SRTの仕組みとPremiere Proからの書き出し方を知ろう', 'SRTを構成する番号・タイムコード・字幕文を確認し、Premiere Proから書き出す',
   '390cafe27baa318274011a18cc06c11b', 401,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 5, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [3-1-2] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-06', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch3'),
   6, 'AIでSRT字幕を一括修正を依頼してみよう', 'タイムコードを変更しないように指示しながら、誤字・固有名詞・表記揺れをAIにまとめて修正してもらう',
   '45014f629ca8e157087dbc2706b5a57d', 278,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 6, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [3-1-3] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-07', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch3'),
   7, '修正版SRTをPremiere Proに戻して確認しよう', '修正版をPremiere Proへ読み込み、誤字・改行・字幕のタイミングを確認する',
   '513bb8b133d0acd542f8cafdccf0aec4', 320,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 7, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [4-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-08', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch4'),
   8, 'スクリーンショットを使ってAIに問題を伝えてみよう', '困っているPremiere Proの画面を撮影し、状況説明と組み合わせてClaudeへ質問する',
   'a6fc5fec900bb74244f643acbd3eb6cf', 334,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 8, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [4-1-2] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-09', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch4'),
   9, 'Claudeの回答をPremiere Proで試してみよう', '回答をPremiere Pro上で実行し、解決しない場合は追加情報を伝えて質問を修正する',
   '9de048f276ae33997bafd6713368e2dd', 338,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 9, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [5-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-10', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch5'),
   10, 'AIに参考動画を分析してもらおう', '文字起こし・スクリーンショット・時間情報などをAIに分析してもらう',
   '6424fd939c2c8e7d0317966acac4d24b', 541,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 10, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [6-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-11', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch6'),
   11, 'AIから編集の評価と改善案をもらってみよう', '短い確認用動画・文字起こし・スクリーンショットなどを渡し、改善箇所とその理由を出してもらう',
   '7c38caad07273c0e3ac063ab877ed463', 671,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 11, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [6-1-2] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-12', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch6'),
   12, 'Premiere Proで修正して修正前と前修正後の動画を比較しよう', 'AIの指摘から優先度の高い部分を選び、Premiere Proで修正して、修正前と修正後を比較する',
   '660a58575de6ed6fec7d0212fc08c224', 384,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 12, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [7-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-13', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch7'),
   13, '動画編集で起きやすい納品事故を整理しよう', '黒画面・仮素材の残り・字幕の誤字・見切れ・無音・音割れ・書き出し設定の間違いなどを確認する',
   '00cfdfa8ae524de15a6154e6299fd01f', 576,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 13, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [8-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-14', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch8'),
   14, 'AIを使って音量調整の方針を整理しよう', '投稿する媒体・動画の内容・声・BGM・SEの構成を伝え、どこを重視して調整するかを整理する',
   'de046c8a71e3a2569acebfc02ae5333e', 584,
   (select id from public.tools where slug = 'claude'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 14, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();
-- [9-1-1] 動画あり
insert into public.lessons
  (slug, course_id, chapter_id, number, title, description, stream_video_id, duration_seconds,
   tool_id, category_id, level, is_published, published_at, sort_order, stream_status)
values
  ('ai-video-basic-15', (select id from public.courses where slug = 'ai-video-basic'),
   (select id from public.chapters where slug = 'ai-video-basic-ch9'),
   15, 'Premiere Proから比較用の候補フレームを書き出そう', '表情・ピント・ブレ・構図・余白などを確認しながら、複数の候補フレームを書き出す',
   '4424d9e8ba877356f2ae164eeb37779f', 187,
   (select id from public.tools where slug = 'premiere'), (select id from public.categories where slug = 'ai'), 'beginner'::public.content_level,
   true, '2026-11-20T00:00:00+09:00', 15, 'ready'::public.stream_status)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  -- 動画はアップロード済みのときだけ上書きする。
  -- 未アップロードの再実行で、既に紐付いた動画を null に戻さないため。
  -- ON CONFLICT の SET 内では既存行をテーブル名で参照する（スキーマ修飾はしない）。
  stream_video_id = coalesce(excluded.stream_video_id, lessons.stream_video_id),
  duration_seconds = case
    when excluded.duration_seconds > 0 then excluded.duration_seconds
    else lessons.duration_seconds
  end,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  stream_status = coalesce(excluded.stream_status, lessons.stream_status),
  updated_at = now();

commit;
