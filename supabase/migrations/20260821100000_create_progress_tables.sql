-- ---------------------------------------------------------------------------
-- フリキャリ Phase 5: 学習進捗のテーブル
--
--   lesson_progress    … 視聴状態 / 再生位置 / 完了日時
--   lesson_view_events … 学習履歴（連続学習日数の算出元）
--   lesson_favorites   … 動画のお気に入り
--   course_favorites   … コースのお気に入り
--
-- 方針
--   - 教材（Phase 3）と進捗（ここ）の境界を保つ。教材テーブルには進捗を持たせない
--   - not_started の行は作らない。「行が無い＝未視聴」とする。
--     アプリ側の getProgress() が未登録を not_started として返す実装と一致させるため、
--     90 本 × ユーザー数の空行を作らずに済む
--   - RLS は auth.uid() = user_id のみ。
--     運営が受講生の進捗を見る画面は Phase 7 の管理機能に属するため、
--     ここでは admin ポリシーを開けない（必要になったら 1 本追加するだけでよい）
--   - 外部キーは lessons.id / courses.id（uuid）。
--     アプリ側の ID は slug なので、変換はサーバー側で行う
-- ---------------------------------------------------------------------------

-- 視聴状態。アプリ側の LessonStatus 型と 1:1 で対応させる。
-- not_started は行を作らない運用だが、型の対応を崩さないため値としては持つ。
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lesson_status') then
    create type public.lesson_status as enum ('not_started', 'in_progress', 'completed');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- lesson_progress
--   1 ユーザー × 1 レッスン = 1 行。複合主キーにより upsert が素直に書ける。
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status public.lesson_status not null default 'in_progress',
  -- 到達した最も先の再生位置（秒）。巻き戻しても減らさない
  position_seconds integer not null default 0 check (position_seconds >= 0),
  -- 初めて完了した日時。再視聴では上書きしない。完了を取り消したら NULL へ戻す
  completed_at timestamptz,
  last_viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  -- status と completed_at がずれた状態を DB 側で作らせない
  constraint lesson_progress_completed_at_matches_status
    check ((status = 'completed') = (completed_at is not null))
);

comment on table public.lesson_progress is
  '学習進捗。行が存在しないレッスンは not_started として扱う（空行は作らない）。';

comment on column public.lesson_progress.position_seconds is
  '到達した最も先の再生位置（秒）。総学習時間の算出元でもある。';

comment on column public.lesson_progress.completed_at is
  '初めて completed になった日時。再視聴では上書きしない。';

-- 「続きから学ぶ」「最近見た動画」「学習を続ける」の並び替え用
create index if not exists lesson_progress_recent_idx
  on public.lesson_progress (user_id, last_viewed_at desc);

-- コース進捗率・学習サマリーの集計用
create index if not exists lesson_progress_status_idx
  on public.lesson_progress (user_id, status);

-- ---------------------------------------------------------------------------
-- lesson_view_events
--   学習履歴の 1 件。1 回の視聴セッションにつき 1 行。
--   同一レッスンの直近イベントが一定時間内なら、アプリ側が新規作成せず
--   viewed_at を更新する（履歴が 30 秒ごとに増殖しないようにするため）。
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_view_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

comment on table public.lesson_view_events is
  '学習履歴。1 回の視聴セッションにつき 1 行。連続学習日数の算出元。';

-- 学習履歴ページの一覧（新しい順）
create index if not exists lesson_view_events_recent_idx
  on public.lesson_view_events (user_id, viewed_at desc);

-- 「同じレッスンの直近イベント」を引くため（セッションのまとめ判定）
create index if not exists lesson_view_events_lesson_recent_idx
  on public.lesson_view_events (user_id, lesson_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- lesson_favorites / course_favorites
--   created_at desc がお気に入りページの「保存日が新しい順」になる。
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

comment on table public.lesson_favorites is
  '動画のお気に入り。created_at desc が「保存日が新しい順」。';

create table if not exists public.course_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

comment on table public.course_favorites is
  'コースのお気に入り。created_at desc が「保存日が新しい順」。';

create index if not exists lesson_favorites_recent_idx
  on public.lesson_favorites (user_id, created_at desc);

create index if not exists course_favorites_recent_idx
  on public.course_favorites (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at トリガー
--   updated_at を持つのは lesson_progress のみ。
--   関数は Phase 3 で定義済みの public.touch_updated_at() を再利用する。
-- ---------------------------------------------------------------------------
drop trigger if exists touch_updated_at on public.lesson_progress;
create trigger touch_updated_at
  before update on public.lesson_progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
--   4 テーブルとも「自分の行だけ」。他ユーザーの進捗は読むことも書くこともできない。
--   auth.uid() を (select ...) で包むのは、行ごとの再評価を避けるため
--   （Phase 3 の既存ポリシーと同じ書き方に揃えている）。
-- ---------------------------------------------------------------------------
alter table public.lesson_progress enable row level security;
alter table public.lesson_view_events enable row level security;
alter table public.lesson_favorites enable row level security;
alter table public.course_favorites enable row level security;

drop policy if exists "Users manage own lesson progress" on public.lesson_progress;
create policy "Users manage own lesson progress"
  on public.lesson_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own view events" on public.lesson_view_events;
create policy "Users manage own view events"
  on public.lesson_view_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own lesson favorites" on public.lesson_favorites;
create policy "Users manage own lesson favorites"
  on public.lesson_favorites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own course favorites" on public.course_favorites;
create policy "Users manage own course favorites"
  on public.course_favorites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 権限
--   匿名からは一切触れない。認証済みユーザーの操作範囲は上記 RLS が決める。
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'lesson_progress',
    'lesson_view_events',
    'lesson_favorites',
    'course_favorites'
  ]
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end
$$;
