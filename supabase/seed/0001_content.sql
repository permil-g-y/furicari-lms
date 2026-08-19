-- ---------------------------------------------------------------------------
-- フリキャリ 教材シードデータ
--
-- !! このファイルは自動生成です。直接編集しないでください。!!
-- 生成元 : src/lib/mock/{courses,taxonomy}.ts
-- 生成方法: npx --yes tsx scripts/generate-content-seed.ts
--
-- slug を一意キーにした upsert なので、何度実行しても同じ状態になります。
-- 既存レコードの手編集（管理画面での変更など）を上書きする点に注意。
-- ---------------------------------------------------------------------------

begin;

-- categories -----------------------------------------------------------------
insert into public.categories (slug, label, sort_order) values
  ('video-editing', '動画編集', 1),
  ('ai', 'AI活用', 2),
  ('client-acquisition', '案件獲得', 3),
  ('sales', '営業', 4),
  ('client-work', 'クライアントワーク', 5)
on conflict (slug) do update set label = excluded.label, sort_order = excluded.sort_order;

-- tools ----------------------------------------------------------------------
insert into public.tools (slug, name, badge, gradient_from, gradient_to, ink, sort_order) values
  ('premiere', 'Premiere Pro', 'Pr', '#2E5FA8', '#1E3A6B', '#2C7BE0', 1),
  ('aftereffects', 'After Effects', 'Ae', '#4A4E8C', '#2A2C55', '#4A4E8C', 2),
  ('capcut', 'CapCut', 'CapCut', '#2BA79A', '#12756E', '#12756E', 3),
  ('davinci', 'DaVinci Resolve', 'DaVinci', '#5B6B85', '#2E3A4E', '#3D4C66', 4),
  ('chatgpt', 'ChatGPT', 'ChatGPT', '#6EC6FF', '#2C7BE0', '#2C7BE0', 5),
  ('claude', 'Claude', 'Claude', '#FFB0BF', '#F1748E', '#D45570', 6)
on conflict (slug) do update set
  name = excluded.name, badge = excluded.badge,
  gradient_from = excluded.gradient_from, gradient_to = excluded.gradient_to,
  ink = excluded.ink, sort_order = excluded.sort_order;

-- courses --------------------------------------------------------------------
insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'premiere-practice',
  'Premiere Pro 実践コース',
  '現場で使う編集フローを、カット編集からテロップ・書き出しまで一通り学びます。',
  '現場で使う編集フローを、素材の読み込みからカット編集・テロップ・BGM・書き出しまで一通り学べるコースです。手を動かしながら進められる構成になっています。',
  (select id from public.categories where slug = 'video-editing'),
  'intermediate'::public.content_level,
  '#EAF4FF',
  'icon-film',
  null,
  null,
  '約6時間',
  '[{"title":"Premiere Proの基本操作とプロジェクト管理","note":"素材の整理からシーケンス設定まで、迷わない作業環境を作れます。"},{"title":"テンポの良いカット編集の考え方","note":"見やすい間の取り方と、ショートカットを使った時短編集を身につけます。"},{"title":"読みやすいテロップ・字幕のデザイン","note":"フォント選びと配置のルールを覚えて、動画の印象を整えます。"},{"title":"納品まで見据えた書き出し設定","note":"YouTube・SNSそれぞれに適した出力設定を選べるようになります。"}]'::jsonb,
  true,
  1
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'editing-basic',
  '動画編集 基礎コース',
  '編集の考え方と基本操作を、はじめての人向けにやさしく解説します。',
  null,
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  '#E9F7F1',
  'icon-video',
  null,
  null,
  '約4時間',
  '[]'::jsonb,
  true,
  2
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'ai-editing',
  'AI動画編集 効率化コース',
  '自動字幕・要約・素材生成などのAIツールで、編集時間を大きく短縮します。',
  null,
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  '#F0EEFF',
  null,
  'AI',
  '#7B7BE0',
  '約5時間',
  '[]'::jsonb,
  true,
  3
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'capcut-practice',
  'CapCut 実践コース',
  'スマホでも作れるSNS向けショート動画を、テンポよく仕上げる方法を学びます。',
  null,
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  '#E7F7F4',
  'icon-film',
  null,
  null,
  '約3時間',
  '[]'::jsonb,
  true,
  4
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'ai-client-acquisition',
  'AI × 案件獲得コース',
  'ポートフォリオ制作から提案文・営業まで、仕事につなげる進め方を学びます。',
  null,
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  '#FFF0F3',
  'icon-medal',
  null,
  null,
  '約7時間',
  '[]'::jsonb,
  true,
  5
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

insert into public.courses (
  slug, title, description, long_description, category_id, level,
  cover_bg_color, cover_icon, cover_text, cover_text_color,
  duration_label, learn_points, is_published, sort_order
) values (
  'ai-client-work',
  'AI × クライアントワークコース',
  'ヒアリング・見積り・修正対応まで、継続案件につながる進め方をまとめました。',
  null,
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  '#FFF7E8',
  'icon-chat',
  null,
  null,
  '約5時間',
  '[]'::jsonb,
  true,
  6
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  category_id = excluded.category_id,
  level = excluded.level,
  cover_bg_color = excluded.cover_bg_color,
  cover_icon = excluded.cover_icon,
  cover_text = excluded.cover_text,
  cover_text_color = excluded.cover_text_color,
  duration_label = excluded.duration_label,
  learn_points = excluded.learn_points,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order;

-- chapters -------------------------------------------------------------------
insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch1', 1, 'はじめに', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch2', 2, '基本操作をマスターする', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch3', 3, 'カット編集', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch4', 4, 'テロップ・字幕', 4
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch5', 5, 'BGM・SE', 5
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'premiere-practice'), 'premiere-practice-ch6', 6, '書き出し', 6
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-editing'), 'ai-editing-ch1', 1, 'AI編集のはじめ方', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-editing'), 'ai-editing-ch2', 2, 'AIで素材を整える', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-editing'), 'ai-editing-ch3', 3, '表現の幅を広げる', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-editing'), 'ai-editing-ch4', 4, 'AIで編集を自動化する', 4
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'editing-basic'), 'editing-basic-ch1', 1, '動画編集をはじめよう', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'editing-basic'), 'editing-basic-ch2', 2, '編集の基本操作', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'editing-basic'), 'editing-basic-ch3', 3, '音と見た目を整える', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'editing-basic'), 'editing-basic-ch4', 4, '仕上げと公開', 4
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'capcut-practice'), 'capcut-practice-ch1', 1, 'CapCutをはじめよう', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'capcut-practice'), 'capcut-practice-ch2', 2, 'ショート動画の作り方', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'capcut-practice'), 'capcut-practice-ch3', 3, '仕上げと投稿', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-acquisition'), 'ai-client-acquisition-ch1', 1, '案件獲得の全体像', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-acquisition'), 'ai-client-acquisition-ch2', 2, 'ポートフォリオを作る', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-acquisition'), 'ai-client-acquisition-ch3', 3, '提案と見積もり', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-acquisition'), 'ai-client-acquisition-ch4', 4, '継続案件につなげる', 4
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-work'), 'ai-client-work-ch1', 1, 'クライアントワークの基本', 1
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-work'), 'ai-client-work-ch2', 2, 'ヒアリングと企画', 2
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-work'), 'ai-client-work-ch3', 3, '見積りと進行管理', 3
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

insert into public.chapters (course_id, slug, number, title, sort_order) values (
  (select id from public.courses where slug = 'ai-client-work'), 'ai-client-work-ch4', 4, '修正対応と継続', 4
)
on conflict (slug) do update set
  course_id = excluded.course_id, number = excluded.number,
  title = excluded.title, sort_order = excluded.sort_order;

-- lessons --------------------------------------------------------------------
insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-01',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch1'),
  1,
  'このコースの進め方',
  null,
  '[]'::jsonb,
  null,
  260,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-02',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch1'),
  2,
  '必要な機材とソフトの準備',
  null,
  '[]'::jsonb,
  null,
  365,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-03',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch2'),
  3,
  'プロジェクトの作成と素材の読み込み',
  '作業前の準備とフォルダ整理のルールを決めておきましょう。',
  '[]'::jsonb,
  null,
  510,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-04',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch2'),
  4,
  'タイムラインの基本操作',
  'トラックの構造とクリップの並べ方を、実際の画面で確認します。',
  '[]'::jsonb,
  null,
  555,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-05',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch2'),
  5,
  'カット編集の基本を身につける',
  'テンポよく見せるための、カットの入れどころと間の作り方を解説します。',
  '["リップル削除とトリミングの使い分け","「間」を残すべき場面の見極め方","編集速度が上がるショートカット5つ"]'::jsonb,
  null,
  765,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-06',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch2'),
  6,
  'ショートカットで編集を速くする',
  null,
  '[]'::jsonb,
  null,
  460,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-07',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch3'),
  7,
  'リズムを意識したカットの作り方',
  null,
  '[]'::jsonb,
  null,
  680,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-08',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch3'),
  8,
  'ジャンプカットとつなぎの工夫',
  null,
  '[]'::jsonb,
  null,
  590,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-09',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch3'),
  9,
  'トランジションの使いどころ',
  null,
  '[]'::jsonb,
  null,
  490,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-10',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch4'),
  10,
  'テロップデザインの作り方',
  '読みやすい文字サイズ・配置・余白の基準を身につけます。',
  '[]'::jsonb,
  null,
  665,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-08-14'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-11',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch4'),
  11,
  '自動文字起こしで字幕を作る',
  null,
  '[]'::jsonb,
  null,
  625,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  11
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-12',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch4'),
  12,
  'テロップのテンプレート化',
  null,
  '[]'::jsonb,
  null,
  475,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  12
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-13',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch5'),
  13,
  'BGMの選び方と音量バランス',
  null,
  '[]'::jsonb,
  null,
  570,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  13
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-14',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch5'),
  14,
  '効果音で印象を変える',
  null,
  '[]'::jsonb,
  null,
  525,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  14
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-15',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch5'),
  15,
  'ナレーションの音声補正',
  null,
  '[]'::jsonb,
  null,
  610,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  15
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-16',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch6'),
  16,
  'YouTube向けの書き出し設定',
  null,
  '[]'::jsonb,
  null,
  450,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  16
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-17',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch6'),
  17,
  'SNS・ショート動画向けの書き出し',
  null,
  '[]'::jsonb,
  null,
  410,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  17
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'premiere-practice-18',
  (select id from public.courses where slug = 'premiere-practice'),
  (select id from public.chapters where slug = 'premiere-practice-ch6'),
  18,
  '納品前のチェックリスト',
  null,
  '[]'::jsonb,
  null,
  340,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-06-01'::timestamptz,
  18
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-01',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  1,
  'AI編集でできることを知る',
  null,
  '[]'::jsonb,
  null,
  380,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'beginner'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-02',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  2,
  'AIツールの準備と初期設定',
  null,
  '[]'::jsonb,
  null,
  430,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'beginner'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-03',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  3,
  'プロンプトの基本を覚える',
  null,
  '[]'::jsonb,
  null,
  350,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'beginner'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-04',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  4,
  'AIで動画の構成台本を作る',
  '企画からナレーション原稿まで、AIと一緒に組み立てる手順です。',
  '[]'::jsonb,
  null,
  580,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'beginner'::public.content_level,
  true,
  '2026-08-16'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-05',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  5,
  'AIで効率UP！自動字幕・要約の使い方',
  '文字起こしと要約を自動化して、編集時間を大きく短縮します。',
  '[]'::jsonb,
  null,
  495,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-06',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch1'),
  6,
  'AIに指示するときのコツ',
  null,
  '[]'::jsonb,
  null,
  445,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-07',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch2'),
  7,
  '素材の整理とネーミングを自動化する',
  null,
  '[]'::jsonb,
  null,
  520,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-08',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch2'),
  8,
  'AIで不要カットを見つける',
  null,
  '[]'::jsonb,
  null,
  540,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-09',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch3'),
  9,
  'After Effectsでアニメーション作成',
  'ロゴやテキストに動きをつけて、動画の質感を一段引き上げます。',
  '[]'::jsonb,
  null,
  860,
  (select id from public.tools where slug = 'aftereffects'),
  (select id from public.categories where slug = 'video-editing'),
  'intermediate'::public.content_level,
  true,
  '2026-08-18'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-10',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch3'),
  10,
  'AIでBGM・SEを選ぶ',
  null,
  '[]'::jsonb,
  null,
  485,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-11',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch4'),
  11,
  'AIによる素材の自動タグ付け',
  null,
  '[]'::jsonb,
  null,
  550,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  11
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-12',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch4'),
  12,
  '文字起こしから字幕データを一括生成する',
  null,
  '[]'::jsonb,
  null,
  630,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  12
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-13',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch4'),
  13,
  'カット候補の抽出とチェックのコツ',
  null,
  '[]'::jsonb,
  null,
  675,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  13
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-editing-14',
  (select id from public.courses where slug = 'ai-editing'),
  (select id from public.chapters where slug = 'ai-editing-ch4'),
  14,
  '自動化しない方がよい作業の見極め方',
  null,
  '[]'::jsonb,
  null,
  465,
  (select id from public.tools where slug = 'chatgpt'),
  (select id from public.categories where slug = 'ai'),
  'intermediate'::public.content_level,
  true,
  '2026-07-01'::timestamptz,
  14
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-01',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch1'),
  1,
  '動画編集の全体像をつかむ',
  null,
  '[]'::jsonb,
  null,
  310,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-02',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch1'),
  2,
  '編集ソフトの選び方',
  null,
  '[]'::jsonb,
  null,
  390,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-03',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch1'),
  3,
  '素材の集め方と管理のルール',
  null,
  '[]'::jsonb,
  null,
  440,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-04',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch2'),
  4,
  'カットの基本を覚える',
  null,
  '[]'::jsonb,
  null,
  520,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-05',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch2'),
  5,
  'つなぎ方のパターンを知る',
  null,
  '[]'::jsonb,
  null,
  470,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-06',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch2'),
  6,
  'テロップを入れてみる',
  null,
  '[]'::jsonb,
  null,
  550,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-07',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch3'),
  7,
  'BGMの入れ方と音量の目安',
  null,
  '[]'::jsonb,
  null,
  405,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-08',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch3'),
  8,
  '効果音の使いどころ',
  null,
  '[]'::jsonb,
  null,
  355,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-09',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch3'),
  9,
  '色味を整える基本',
  null,
  '[]'::jsonb,
  null,
  485,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-10',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch4'),
  10,
  '書き出しの基本設定',
  null,
  '[]'::jsonb,
  null,
  380,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-11',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch4'),
  11,
  'サムネイルの作り方',
  null,
  '[]'::jsonb,
  null,
  455,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  11
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'editing-basic-12',
  (select id from public.courses where slug = 'editing-basic'),
  (select id from public.chapters where slug = 'editing-basic-ch4'),
  12,
  '公開までの流れを確認する',
  null,
  '[]'::jsonb,
  null,
  345,
  (select id from public.tools where slug = 'premiere'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-04-01'::timestamptz,
  12
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-01',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch1'),
  1,
  'CapCutの画面構成を知る',
  null,
  '[]'::jsonb,
  null,
  330,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-02',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch1'),
  2,
  'CapCutで作る！SNS向けショート動画編集',
  '縦型動画のテンポと文字入れを、スマホでも作れる形で解説します。',
  '[]'::jsonb,
  null,
  630,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-03',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch1'),
  3,
  'テンプレートを活用する',
  null,
  '[]'::jsonb,
  null,
  375,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-04',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch2'),
  4,
  '縦型構図の考え方',
  null,
  '[]'::jsonb,
  null,
  420,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-05',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch2'),
  5,
  'テロップを速く入れるコツ',
  null,
  '[]'::jsonb,
  null,
  500,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-06',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch2'),
  6,
  '音ハメ編集の基本',
  null,
  '[]'::jsonb,
  null,
  545,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-07',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch2'),
  7,
  'トレンド音源の選び方',
  null,
  '[]'::jsonb,
  null,
  400,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-08',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch3'),
  8,
  'エフェクトの使いどころ',
  null,
  '[]'::jsonb,
  null,
  445,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-09',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch3'),
  9,
  '書き出し設定を整える',
  null,
  '[]'::jsonb,
  null,
  350,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'capcut-practice-10',
  (select id from public.courses where slug = 'capcut-practice'),
  (select id from public.chapters where slug = 'capcut-practice-ch3'),
  10,
  '各SNSへの投稿のコツ',
  null,
  '[]'::jsonb,
  null,
  370,
  (select id from public.tools where slug = 'capcut'),
  (select id from public.categories where slug = 'video-editing'),
  'beginner'::public.content_level,
  true,
  '2026-05-10'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-01',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch1'),
  1,
  '案件獲得までの流れを知る',
  null,
  '[]'::jsonb,
  null,
  410,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-02',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch1'),
  2,
  '自分の強みを言語化する',
  null,
  '[]'::jsonb,
  null,
  490,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-03',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch1'),
  3,
  '単価の考え方を身につける',
  null,
  '[]'::jsonb,
  null,
  450,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-04',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch1'),
  4,
  '動き出す前に整えておく準備',
  null,
  '[]'::jsonb,
  null,
  365,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-05',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch2'),
  5,
  'ポートフォリオの構成を考える',
  null,
  '[]'::jsonb,
  null,
  560,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-06',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch2'),
  6,
  '掲載する作品の選び方',
  null,
  '[]'::jsonb,
  null,
  465,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-07',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch2'),
  7,
  'AIで作品紹介文を書く',
  null,
  '[]'::jsonb,
  null,
  515,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-08',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch2'),
  8,
  '見せ方を整えて印象を上げる',
  null,
  '[]'::jsonb,
  null,
  430,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-09',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch2'),
  9,
  '公開と更新のコツ',
  null,
  '[]'::jsonb,
  null,
  385,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-10',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch3'),
  10,
  'はじめての提案文の書き方',
  '実績が少なくても伝わる、提案文の構成と例文を紹介します。',
  '[]'::jsonb,
  null,
  810,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'intermediate'::public.content_level,
  true,
  '2026-08-12'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-11',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch3'),
  11,
  '見積もりの作り方',
  null,
  '[]'::jsonb,
  null,
  580,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  11
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-12',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch3'),
  12,
  '相場の調べ方と考え方',
  null,
  '[]'::jsonb,
  null,
  475,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  12
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-13',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch3'),
  13,
  'AIで提案文を磨く',
  null,
  '[]'::jsonb,
  null,
  530,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  13
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-14',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch3'),
  14,
  '断られたあとの動き方',
  null,
  '[]'::jsonb,
  null,
  395,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  14
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-15',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  15,
  '初回納品で信頼を得る',
  null,
  '[]'::jsonb,
  null,
  495,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  15
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-16',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  16,
  'レスポンスの基本を整える',
  null,
  '[]'::jsonb,
  null,
  410,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  16
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-17',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  17,
  '単価を上げる交渉の進め方',
  null,
  '[]'::jsonb,
  null,
  570,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  17
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-18',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  18,
  '紹介につなげる動き方',
  null,
  '[]'::jsonb,
  null,
  440,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  18
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-19',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  19,
  'トラブルを未然に防ぐ',
  null,
  '[]'::jsonb,
  null,
  480,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  19
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-acquisition-20',
  (select id from public.courses where slug = 'ai-client-acquisition'),
  (select id from public.chapters where slug = 'ai-client-acquisition-ch4'),
  20,
  '案件管理を仕組み化する',
  null,
  '[]'::jsonb,
  null,
  465,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-acquisition'),
  'advanced'::public.content_level,
  true,
  '2026-05-20'::timestamptz,
  20
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-01',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch1'),
  1,
  'クライアントワークの流れをつかむ',
  null,
  '[]'::jsonb,
  null,
  430,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-02',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch1'),
  2,
  '最初のやりとりで決まること',
  null,
  '[]'::jsonb,
  null,
  400,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  2
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-03',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch1'),
  3,
  '契約前に確認しておくこと',
  null,
  '[]'::jsonb,
  null,
  500,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  3
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-04',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch1'),
  4,
  'スケジュールの立て方',
  null,
  '[]'::jsonb,
  null,
  420,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  4
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-05',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch2'),
  5,
  'ヒアリングシートの作り方',
  null,
  '[]'::jsonb,
  null,
  555,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  5
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-06',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch2'),
  6,
  'AIで企画案を広げる',
  null,
  '[]'::jsonb,
  null,
  510,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  6
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-07',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch2'),
  7,
  '構成案の伝え方',
  null,
  '[]'::jsonb,
  null,
  470,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  7
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-08',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch2'),
  8,
  '認識のズレを防ぐ進め方',
  null,
  '[]'::jsonb,
  null,
  415,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  8
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-09',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch3'),
  9,
  '見積りの組み立て方',
  null,
  '[]'::jsonb,
  null,
  525,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  9
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-10',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch3'),
  10,
  '追加費用の伝え方',
  null,
  '[]'::jsonb,
  null,
  445,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  10
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-11',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch3'),
  11,
  '進行状況の共有のしかた',
  null,
  '[]'::jsonb,
  null,
  390,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  11
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-12',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch3'),
  12,
  '納期を守る仕組みを作る',
  null,
  '[]'::jsonb,
  null,
  460,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  12
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-13',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch4'),
  13,
  '修正依頼の受け止め方',
  null,
  '[]'::jsonb,
  null,
  485,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  13
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-14',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch4'),
  14,
  '修正回数をルール化する',
  null,
  '[]'::jsonb,
  null,
  405,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  14
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-15',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch4'),
  15,
  '納品後のフォロー',
  null,
  '[]'::jsonb,
  null,
  435,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  15
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

insert into public.lessons (
  slug, course_id, chapter_id, number, title, description, key_points,
  stream_video_id, duration_seconds, tool_id, category_id, level,
  is_published, published_at, sort_order
) values (
  'ai-client-work-16',
  (select id from public.courses where slug = 'ai-client-work'),
  (select id from public.chapters where slug = 'ai-client-work-ch4'),
  16,
  '継続契約につなげる提案',
  null,
  '[]'::jsonb,
  null,
  515,
  (select id from public.tools where slug = 'claude'),
  (select id from public.categories where slug = 'client-work'),
  'advanced'::public.content_level,
  true,
  '2026-07-28'::timestamptz,
  16
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  chapter_id = excluded.chapter_id,
  number = excluded.number,
  title = excluded.title,
  description = excluded.description,
  key_points = excluded.key_points,
  duration_seconds = excluded.duration_seconds,
  tool_id = excluded.tool_id,
  category_id = excluded.category_id,
  level = excluded.level,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  sort_order = excluded.sort_order;

commit;

-- 生成サマリ: categories 5 / tools 6 / courses 6 / chapters 25 / lessons 90