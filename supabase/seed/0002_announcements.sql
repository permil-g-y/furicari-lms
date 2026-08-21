-- ---------------------------------------------------------------------------
-- フリキャリ Phase 6-A: お知らせのシード
--
--   Phase 1 のダミーお知らせ 8 件のうち、**本文を持つ 1 件だけ**を投入する。
--   残り 7 件はタイトルしか無く、詳細ページを開いても空になるため投入しない
--   （ダミー本文を新規に書き起こすことはしない、という方針）。
--
--   slug をキーにした upsert なので、何度実行しても同じ状態になる。
-- ---------------------------------------------------------------------------

insert into public.announcements (slug, title, category, body, related_links, published_at, is_published)
values (
  'ann-01',
  '「AI動画編集 効率化コース」に新しいChapterを追加しました',
  'new_course',
  $json$[
    { "type": "paragraph", "text": "いつもフリキャリをご利用いただきありがとうございます。" },
    { "type": "paragraph", "text": "このたび「AI動画編集 効率化コース」に、新しいChapterを追加しました。" },
    { "type": "heading", "text": "追加した内容" },
    { "type": "paragraph", "text": "今回追加したChapter 4では、AIを使った素材整理と、テロップ作成の自動化を扱います。これまで手作業で行っていた文字起こし・要約・カット候補の抽出を、AIツールに任せる流れを実際の画面で解説しています。" },
    {
      "type": "callout",
      "title": "Chapter 4　AIで編集を自動化する（全4本・約1時間20分）",
      "items": [
        "・AIによる素材の自動タグ付け",
        "・文字起こしから字幕データを一括生成する",
        "・カット候補の抽出とチェックのコツ",
        "・自動化しない方がよい作業の見極め方"
      ]
    },
    { "type": "heading", "text": "受講中の方へ" },
    { "type": "paragraph", "text": "すでに受講中の方は、追加費用なしでそのままご視聴いただけます。学習進捗は引き継がれますので、続きから学習を進めてください。" },
    { "type": "paragraph", "text": "ご不明な点がありましたら、お問い合わせフォームよりご連絡ください。" }
  ]$json$::jsonb,
  $json$[
    { "icon": "icon-book", "label": "AI動画編集 効率化コースを見る", "href": "/courses/ai-editing" },
    { "icon": "icon-film", "label": "追加された動画を一覧で確認する", "href": "/videos" }
  ]$json$::jsonb,
  -- Claude Design 上の表示日 2026/08/18 を日本時間の 0 時として保持する
  '2026-08-18T00:00:00+09:00'::timestamptz,
  true
)
on conflict (slug) do update set
  title         = excluded.title,
  category      = excluded.category,
  body          = excluded.body,
  related_links = excluded.related_links,
  published_at  = excluded.published_at,
  is_published  = excluded.is_published;
