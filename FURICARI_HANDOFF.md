# フリキャリ LMS 開発引き継ぎ資料

> このファイルは、開発経緯を知らない新しい AI セッション / 開発者が
> **これ一枚で現状を正確に把握し、安全に開発を継続する**ためのものです。
>
> 記載内容はすべてリポジトリのコード・Git 履歴・Supabase migrations から確認した事実です。
> 推測は含みません。実装済みと未実装は明確に分けています。
>
> 最終更新: Phase 7 実装完了 / 総合 QA 中（ブランチ `feature/phase7-admin`）

---

## 1. プロジェクト概要

### 何のためのシステムか

**フリキャリ**は「動画編集 × AI」を動画中心で学ぶ、**招待制のオンライン学習サイト（LMS）**。
受講生が動画編集スキルに加えて、AI を活用した編集効率化・企画・営業・クライアントワークを体系的に学べる環境を提供する。

**一般公開型の会員登録サービスではない。** スクール受講生のみが利用でき、
アカウントは必ず運営側からの招待を起点として作られる。

### 最重要 UX

> ログインした受講生が、迷わず次の学習を始められること

装飾性より「今どこまで進んでいるか / 次に何をすればいいか」が直感的に分かることを優先する。

### 現在どこまで開発されているか

| Phase | 内容 | 状態 |
|---|---|---|
| Phase 1 | Claude Design 準拠の UI 実装（ダミーデータ） | ✅ 完了 |
| Phase 2 | Supabase Auth・招待制認証 | ✅ 完了 |
| Phase 3 | 教材データ（Course / Chapter / Lesson）の DB 化 | ✅ 完了 |
| Phase 4 | Cloudflare Stream 接続（**テスト動画 1 本のみ**） | ✅ 完了 |
| Phase 5 | 学習進捗・履歴・お気に入りの DB 化 | ✅ 完了 |
| Phase 6 | 受講権限・お知らせ・検索・マイページ | ✅ 完了 |
| Phase 7 | 管理画面・運用機能 | 🟡 実装完了 / 総合 QA 中 |
| Phase 7 | 管理機能（管理画面） | ⬜ 未着手 |
| Phase 8 | テスト・セキュリティ・本番デプロイ | ⬜ 未着手 |

### 今後目指している完成形

- 運営が管理画面からコース・動画・お知らせを CRUD でき、コードを触らず教材を更新できる
- 受講生ごとの受講権限（`user_course_enrollments`）で閲覧範囲を制御
- 学習進捗・視聴位置・お気に入り・履歴がユーザーごとに永続化される
- 全動画が Cloudflare Stream で署名付き配信される
- 将来的に「決済完了 → Supabase ユーザー自動作成 → 招待メール送信」まで自動化

---

## 2. 技術スタック

`package.json` から確認した実際の構成。

| 領域 | 採用 | バージョン |
|---|---|---|
| Framework | Next.js（App Router / Turbopack） | **16.3.1** |
| UI | React / React DOM | **19.2.8** |
| 言語 | TypeScript | ^5 |
| スタイル | Tailwind CSS（`@theme` によるトークン定義） | **v4** |
| PostCSS | `@tailwindcss/postcss` | ^4 |
| 認証・DB | `@supabase/supabase-js` | ^2.112.3 |
| SSR 認証 | `@supabase/ssr` | ^0.12.4 |
| サーバー限定保護 | `server-only` | ^0.0.1 |
| Lint | ESLint / `eslint-config-next` | ^9 / 16.3.1 |
| 動画配信 | Cloudflare Stream（署名付き URL） | — |
| Hosting | **未デプロイ**（Vercel を第一候補として想定。Phase 8） | — |

### 重要な環境固有の注意点

- **Next.js 16 では `middleware.ts` が `proxy.ts` にリネームされている。**
  本プロジェクトも `src/proxy.ts` を使用。`middleware.ts` を作っても動かない。
- **Tailwind v4 のため `tailwind.config.ts` は存在しない。**
  デザイントークンはすべて `src/app/globals.css` の `@theme` ブロックに定義。
- リポジトリルートに `AGENTS.md` / `CLAUDE.md` があり、
  `next dev` が自動生成・再追記する。Next.js の破壊的変更について
  `node_modules/next/dist/docs/` を参照するよう指示している。
- テストランナーは Node 標準の `node:test` を `tsx` 経由で実行（`npm test`）。
  Jest / Vitest は導入していない。

---

## 3. ディレクトリ・主要ファイル

```
furicari/
├── src/
│   ├── proxy.ts                    ★ Next.js 16 の Proxy（旧 middleware）
│   ├── app/
│   │   ├── layout.tsx              フォント（Noto Sans JP / M PLUS Rounded 1c）+ AuthHashHandler
│   │   ├── globals.css             ★ デザイントークンの唯一の定義場所（@theme）
│   │   ├── (auth)/                 認証ゾーン（Header/Footer/TabBar なし）
│   │   └── (main)/                 認証必須ゾーン
│   ├── components/
│   ├── lib/
│   └── ...
├── supabase/
│   ├── README.md                   SQL の適用手順
│   ├── migrations/                 ★ 適用順に 3 ファイル
│   └── seed/0001_content.sql       教材シード（自動生成）
├── scripts/
└── FURICARI_HANDOFF.md             このファイル
```

### 3-1. 認証まわり

| ファイル | 担当 |
|---|---|
| `src/proxy.ts` | 全リクエストで Supabase セッションを更新し、Protected Route を保護。`config.matcher` で静的アセットを除外 |
| `src/lib/supabase/proxy.ts` | `updateSession()` の実体。`getClaims()` で JWT 署名を検証し、未ログインは `/login` へ、ログイン済みの `/login` は `/` へリダイレクト。`PUBLIC_PATHS` にパブリックなパスを定義 |
| `src/lib/supabase/client.ts` | ブラウザ用 Supabase クライアント（`createBrowserClient`） |
| `src/lib/supabase/server.ts` | サーバー用（`createServerClient` + `cookies()`）。Server Component では Cookie を書けないため `setAll` は失敗し得るが、更新は proxy が担当するので握りつぶす |
| `src/lib/supabase/env.ts` | Supabase URL / 公開鍵 / サイト URL の読み出し。Publishable key を優先し anon key にフォールバック |
| `src/lib/supabase/admin.ts` | **未使用**。Secret key を使う管理者クライアント。`server-only`。Phase 7 の招待機能で使う想定 |
| `src/lib/supabase/email-link.ts` | 認証メール送信専用クライアント。**`flowType: "implicit"`**（理由は §10） |
| `src/lib/auth/user.ts` | `getAuthUser()` / `getProfile()` / `getSessionUser()` / `requireUser()`。`server-only` |
| `src/lib/auth/actions.ts` | Server Actions：ログイン / ログアウト / リセット送信 / パスワード設定。Supabase のエラーを日本語化 |
| `src/lib/auth/state.ts` | `AuthActionState` と `initialAuthState`。**`"use server"` ファイルから非関数を export できないため分離してある**（触らないこと） |
| `src/app/auth/confirm/route.ts` | 招待 / リセットメールの受け口。`token_hash`（公式推奨）と `code`（PKCE）の両方式に対応 |
| `src/components/auth/AuthHashHandler.tsx` | ルートレイアウト常駐。URL ハッシュ（`#access_token=...`）でトークンが返る暗黙フローを受け取りセッションを確立する |
| `src/components/auth/AuthShell.tsx` | 認証画面の共通シェル。ログイン画面のデザインを切り出したもの |

### 3-2. LMS（教材データ）まわり

| ファイル | 担当 |
|---|---|
| `src/lib/content/server.ts` | ★ **教材取得の入口**。Supabase から 1 リクエスト 1 回だけ全件取得（React `cache()`）。`getContent()` / `getContentBundle()` |
| `src/lib/content/snapshot.ts` | DB 行 → ドメイン型への変換。**id には uuid ではなく slug を入れる** |
| `src/lib/content/api.ts` | `createContentApi()`。同期セレクタ群（`getCourse` / `getLesson` / `getChapterStats` など）を提供 |
| `src/lib/content/context.tsx` | `ContentProvider` / `useContent()`。Client Component へスナップショットを配る |
| `src/lib/content/format.ts` | データ非依存の純粋フォーマッタ（`formatDuration` / `levelLabel` など） |
| `src/lib/content/mock-fallback.ts` | **開発用フォールバックのみ**。migration 未適用時に動かすため。恒久的な primary source ではない |
| `src/lib/content/content.test.ts` | DB 由来のスナップショットが Phase 1 の内容と一致することを検証（13 テスト） |
| `src/lib/progress/dummy.ts` | ★ **学習進捗のダミーデータ**。Phase 5 でここを Supabase 由来に差し替える |
| `src/lib/mock/` | お知らせ（Phase 6 で DB 化）・ユーザーのダミー項目・進捗の生データ・フォールバック用の教材定義 |
| `src/lib/types.ts` | ドメイン型（Course / Chapter / Lesson / Category / Tool など） |
| `src/lib/supabase/database.types.ts` | DB の型定義。migrations と 1:1 |

### 3-3. Watch ページ・Video Player・Cloudflare Stream

| ファイル | 担当 |
|---|---|
| `src/app/(main)/watch/[lessonId]/page.tsx` | ★ Server Component。`requireUser()` の後に `createPlaybackSource()` で**署名付き再生ソースを発行**し `WatchView` へ渡す |
| `src/components/video/WatchView.tsx` | 動画閲覧のクライアント本体。PC / Mobile のレイアウトを出し分け、`playback` を両プレイヤーへ渡す |
| `src/components/video/VideoPlayer.tsx` | PC 版プレイヤー。`playback` が placeholder 以外なら `StreamStage`、それ以外は Phase 1 のダミー |
| `src/components/video/MobileVideoPlayer.tsx` | Mobile 版。本物再生時も**戻る「←」と通し番号ピルを映像の上に重ねて維持**する |
| `src/components/video/StreamStage.tsx` | Cloudflare の iframe を 16:9 で描画。`kind: "error"` のときは簡素なエラー表示 + 再読み込み |
| `src/lib/stream/index.ts` | ★ プロバイダ選択。資格情報が揃えば Cloudflare、無ければダミー |
| `src/lib/stream/cloudflare.ts` | ★ **RS256 JWT の署名生成**。`server-only` |
| `src/lib/stream/types.ts` | `PlaybackSource`（`placeholder` / `cloudflare-stream` / `error`）と `VideoStreamProvider` |

### 3-4. レイアウト・UI

| ファイル | 担当 |
|---|---|
| `src/components/layout/AppShell.tsx` | パスから「PC ヘッダーの active / Mobile ヘッダー / タブバー」を決定。タブバー分の下余白もここで付与 |
| `src/components/layout/Header.tsx` | PC ヘッダー。**`hidden lg:block` は Header 自身に付ける**（ラッパーで囲むと sticky が壊れる。§11 参照） |
| `src/components/layout/MobileHeader.tsx` / `MobileTabBar.tsx` / `Footer.tsx` | Mobile ヘッダー / ボトムタブ / PC フッター |
| `src/components/ui/` | Button / Tag / ProgressBar / Filters / Icon |

### 3-5. スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm test` | 自動テスト（`tsx --test`） |
| `npm run seed:generate` | `src/lib/mock` から教材シード SQL を再生成 |
| `npm run db:verify` | Supabase にテーブルが揃っているかを匿名アクセスで判定 |
| `npm run types:supabase` | Supabase CLI で型再生成（要 `SUPABASE_PROJECT_REF`） |

---

## 4. データ構造

### 4-1. テーブル一覧

migrations は**適用順**に以下の 3 ファイル。すべて Supabase に適用済み。

| # | ファイル | 内容 |
|---|---|---|
| 1 | `20260819120000_create_profiles.sql` | `profiles` / RLS / 招待時トリガー |
| 2 | `20260819140000_create_content_tables.sql` | 教材テーブル群 / RLS / `is_admin()` |
| 3 | `20260820100000_link_test_stream_video.sql` | テスト動画 1 本の紐付け |

### 4-2. リレーション

```
auth.users (Supabase Auth)
  └─1:1─ profiles
  └─1:N─ user_course_enrollments ─N:1─ courses

categories ─1:N─ courses
categories ─1:N─ lessons
tools      ─1:N─ lessons

courses ─1:N─ chapters ─1:N─ lessons
courses ─1:N─ lessons          （course_id は検索用に非正規化して保持）
```

### 4-3. 主要カラム

**profiles**（auth.users と 1:1）

| カラム | 備考 |
|---|---|
| `id` uuid PK | `auth.users.id` を参照 |
| `display_name` text | 招待直後は NULL になり得る。アプリ側でメールのローカル部にフォールバック |
| `avatar_url` text | |
| `role` `user_role` enum | `student` / `admin`。既定 `student`。**本人からは変更不可** |
| `notification_enabled` boolean | |

**courses**

| カラム | 備考 |
|---|---|
| `id` uuid PK / `slug` text unique | **アプリ側の id は slug**（`premiere-practice` 等） |
| `title` / `description` / `long_description` | |
| `category_id` / `level`（`content_level` enum） | |
| `cover_bg_color` / `cover_icon` / `cover_text` / `cover_text_color` | カバーは画像ではなくアイコン + パステル背景 |
| `duration_label` | 「約6時間」等の編集者が決める表示ラベル |
| `learn_points` jsonb | `[{title, note}]` |
| `is_published` / `sort_order` | 管理画面前提 |

**chapters**：`course_id` / `slug` unique / `number`（表示用の「Chapter 2」の 2）/ `title` / `sort_order`

**lessons**

| カラム | 備考 |
|---|---|
| `id` uuid PK / `slug` text unique | アプリ側の id は slug（`premiere-practice-05` 等） |
| `course_id` / `chapter_id` | |
| `number` | 通し番号（"05" とゼロ埋め表示） |
| `title` / `description` / `key_points` jsonb | |
| **`stream_video_id` text** | ★ Cloudflare Stream の Video UID。**NULL ならダミープレイヤー** |
| `duration_seconds` / `tool_id` / `category_id` / `level` | |
| `is_published` / `published_at` / `sort_order` | |

**user_course_enrollments**（受講権限）

| カラム | 備考 |
|---|---|
| `user_id` + `course_id` 複合 PK | |
| `expires_at` | NULL は無期限 |

> ⚠️ **Phase 3 時点ではコンテンツの SELECT ポリシーをこのテーブルで絞っていない。**
> 現在のテストユーザーが既存コースを閲覧できる状態を維持するため。
> Phase 6 以降でポリシーを差し替えるだけで受講制御を有効化できる設計。

### 4-4. 進捗（Progress）について

**進捗テーブルはまだ存在しない。** Phase 5 の領域。

現在の「44%」「18本中8本」「視聴中62%」等はすべて
`src/lib/progress/dummy.ts` のダミー値。教材（Supabase）と進捗（ダミー）の
境界はこの 1 ファイルに閉じている。

### 4-5. RLS の重要ルール

| 対象 | student | admin |
|---|---|---|
| `profiles` | 自分の行のみ SELECT / UPDATE | — |
| `categories` / `tools` | SELECT 可 | 全 CRUD |
| `courses` | `is_published = true` のみ SELECT | 非公開含め全 CRUD |
| `chapters` | 親コースが公開なら SELECT | 全 CRUD |
| `lessons` | 自身が公開 **かつ** 親コースが公開なら SELECT | 全 CRUD |
| `user_course_enrollments` | 自分の行のみ SELECT | 付与・剥奪 |

**特に重要な保護：**

- `role` は **列レベル権限**（`grant update (display_name, avatar_url, notification_enabled)`）と
  **BEFORE UPDATE トリガー**（`protect_profile_columns`）の**二層**で保護。
  student が自分を admin へ昇格させることは SQL レベルで不可能。
  → 実測で `403 permission denied` を確認済み。
- `is_admin()` は **SECURITY DEFINER** 関数。
  RLS ポリシーから `profiles` を直接参照すると再帰するため。
- `handle_new_user()` トリガーは例外を握りつぶす。
  profiles 作成に失敗しても **Auth ユーザー作成を巻き添えにしない**ため。

---

## 5. Phase ごとの実装状況

### Phase 1 — UI 実装（✅ 完了 / コミット `115c25d`）

**目的**：Claude Design で完成した UI を完全踏襲した Next.js レスポンシブアプリ（ダミーデータ）

**実装したもの**
- 全 11 ページ（TOP / コース一覧 / コース詳細 / 動画一覧 / 動画閲覧 / お気に入り / 学習履歴 / お知らせ一覧 / お知らせ詳細 / マイページ / ログイン）
- デザイントークンを `globals.css` の `@theme` に集約
- 共通コンポーネント（Header / MobileHeader / MobileTabBar / Footer / AppShell / Button / Tag / ProgressBar / Filters / VideoCard 等）

**重要な設計判断**
- PC 基準 1440px / Mobile 基準 390px。**切り替え点は `lg`（1024px）**
- 構造が大きく異なる箇所は PC / Mobile のサブツリーを出し分ける
- Claude Design に Mobile 版が無い 5 ページ（お気に入り / 学習履歴 / お知らせ一覧・詳細 / マイページ）は既存 Mobile デザインシステムから補完
- 動画サムネイルは実画像ではなく「ツール別グラデーション + バッジ + CSS 三角」で描画（これがデザイン仕様）

**Reference 原本**
`../フリキャリ TOPページ PC版/`（リポジトリ**外**）に Claude Design の出力が保管されている。
デザインの正解はここ。**編集・削除しないこと。**

### Phase 2 — Supabase 認証（✅ 完了 / コミット `a134b24`）

**目的**：招待制の本物の認証基盤

**実装したもの**
- `@supabase/ssr` による Cookie ベースのセッション
- ログイン / ログアウト / セッション維持 / パスワードリセット
- 招待メール → 初回パスワード設定 → ログイン
- Protected Route を **proxy と Server Component の二重**で保護
- `profiles` テーブル + 自動生成トリガー + RLS

**重要な設計判断**
- 認可判定は **`getClaims()`**（JWT 署名検証）。`getSession()` はサーバーで信用しない（Supabase 公式指針）
- **一般 Sign Up は実装しない。** ログイン画面の「新規登録」導線も削除済み。
  Supabase 側でも自己サインアップを無効化済み
- メールリンクは**暗黙フロー**で受け取る（理由は §10）

**検証結果**：招待 → 初回パスワード設定 → ログイン → セッション維持 → ログアウト →
再ログイン → パスワードリセット、および RLS（role 昇格 403 / 他ユーザー profile 0 件）を実機確認済み

**⚠️ 未解決の運用課題**
Supabase の標準 SMTP は**組織メンバーのアドレスにしか送信できず、1 時間 2 通の制限**がある。
**受講生に招待メールを送るには Custom SMTP（Resend 等）の設定が必須。**

### Phase 3 — 教材の DB 化（✅ 完了 / コミット `4c0945a`）

**目的**：教材データをコードから Supabase へ移行し、コードを触らず教材を更新できる状態にする

**実装したもの**
- `categories` / `tools` / `courses` / `chapters` / `lessons` / `user_course_enrollments`
- 教材シード（コース 6 / チャプター 25 / レッスン 90）を `src/lib/mock` から自動生成
- Content API（サーバーで 1 回取得 → Context 配布）
- 自動テスト 13 件

**重要な設計判断**
- **uuid 主キー + slug unique**。アプリ側の id は slug にして Phase 1 の URL を維持
- **サーバーで 1 リクエスト 1 回だけ全件取得**（件数が小さいため）。N+1 が起きない
- 既存の同期セレクタ API を維持したので、**JSX を一切変更せず**にデータ源だけ差し替えられた
- 進捗系カラムは courses に置かない（教材と進捗の境界を明確化）

**検証結果**
- DB 実件数：categories 5 / tools 6 / **courses 6 / chapters 25 / lessons 90**
- フォールバック警告が出ないことで **Supabase 経路であることを確認**
- 全 10 ページの表示・遷移・リンク監査（不正リンク 0）・Mobile 横スクロール 0

### Phase 4 — Cloudflare Stream 接続テスト（✅ 完了 / コミット `71aa130`）

**目的**：**1 本だけ**本物の動画を再生し、残りはダミープレイヤーを維持する

詳細は §6。

**現在の状態**
- `premiere-practice-05` のみ実動画。**残り 89 本は `stream_video_id` が NULL でダミー維持**
- プレイヤー UI は**本物再生時のみ Cloudflare 公式プレイヤーの見た目**になる
  （Phase 1 のコントロールデザインへ寄せるのは後続 Phase）

### Phase 5 — 学習進捗の DB 化（✅ 完了）

**目的**：学習進捗・視聴履歴・お気に入りを Supabase へ移し、ダミー値を実データへ置き換える

**実装したもの**
- `lesson_progress` / `lesson_view_events` / `lesson_favorites` / `course_favorites`（migration 4 本目）
- 進捗の集計を純粋関数へ分離（`src/lib/progress/compute.ts`）+ 自動テスト 17 件追加（計 30 件）
- 再生位置の保存（**30 秒間隔** + 一時停止 + 離脱時の `sendBeacon`）
- **90% 到達で自動完了** + 「視聴済みにする」による手動完了
- お気に入りの永続化（Server Action + 楽観的更新）
- 予期しないエラーの受け皿（`src/app/error.tsx`）

**重要な設計判断**
- **視聴開始の記録は Client の effect から送る。** Next.js はリンクのホバーだけで Server Component を
  プリフェッチするため、サーバー側で記録すると「見ていない動画」の履歴が作られてしまう
- **再生位置の保存だけ Route Handler**（`/api/progress`）。離脱時の `navigator.sendBeacon` は
  URL にしか送れず、Server Action を呼べないため
- **90% 判定はサーバー側。** クライアントが送るのは再生位置と実尺だけ
- **位置は単調増加。** PC 用と Mobile 用のプレイヤーが同時に DOM 上へ存在するため、
  非表示側から 0 が送られ得る。クライアントとサーバーの二重で弾く
- **日付は必ず JST で扱う。** Supabase も Vercel も UTC で動くため、素直に変換すると
  日本時間の朝 9 時より前の視聴が前日扱いになり連続学習日数が途切れる（`content/format.ts` に集約）

**⚠️ 実ブラウザ検証で見つかった落とし穴（再発させないこと）**

**Phase 7 で踏んだもの**

| 症状 | 原因 | 教訓 |
| --- | --- | --- |
| ログイン直後に必ずエラー画面が出る | Supabase 内部の秒未満の時計差で JWT の `iat` が未来に見える（PGRST303） | アプリ側に原因が無い障害は、fetch の 1 箇所で吸収する。再試行するのは PGRST303 だけ |
| 受講していないコースの動画リンクが TOP・動画一覧・検索に残っていた | リンクを張る場所ごとに判定を書いていた | **リンクを張る手段そのもの**を共通部品へ集約する。admin は全コース再生できるため、この種の不具合は管理者アカウントでは絶対に見つからない |
| 予約公開のお知らせが受講生画面に出る | 受講生向けの取得を RLS だけに任せていた。RLS は「admin には全件見せる」分岐も持つ | 受講生向けの取得は**公開条件をクエリで明示する**。同じ問題が教材（courses / lessons）にもあった |
| 「公開する」を押しても反映されない | 変換完了後もポーリングが `router.refresh()` を撃ち続け、クリックを潰していた | 決着がついたらポーリングを止める |
| 動画を持たないレッスンの公開状態を変えられない | 公開ボタンを動画カードの中に置いていた | 属性の所有者を取り違えない |


| 症状 | 原因 | 対処 |
|---|---|---|
| 動画が "An unknown error occurred" で再生できない | 再生 URL の `startTime` が**実尺を超えていた**。`lessons.duration_seconds` は編集者が入れる表示用の値で、アップロード済みファイルの実尺と食い違う（テスト動画は実尺 58 秒 / DB は 12:45） | `startTime` を URL で渡さず、再生開始後の `timeupdate` を起点にシークする |
| 最後まで見ても完了にならない | 90% 判定の分母が DB の尺（765 秒）で、実尺 58 秒と 食い違う | プレイヤーが報告する実尺を分母にする |
| 同上（別要因） | PC 用と Mobile 用の `<Stream>` を**同じ署名トークンで同時に初期化**して衝突 | `useIsDesktopLayout()` で**表示されている側にだけ**再生ソースを渡す |
| `loadedmetadata` が発火しない | Cloudflare のプレイヤーは `preload="metadata"` でも再生開始まで通知しないことがある | 確実に届く `timeupdate` を起点にする |

**検証結果（実ブラウザ・本番ビルド）**
- 再開位置：20 秒へ設定 → 5 秒再生 → **27 秒** に更新（0 秒からなら保存が走らないため決定的）
- 90% 自動完了：実尺 58 秒の動画を最後まで再生 → **completed**（DB の 765 秒基準なら 7.6% で完了し得ない）
- 30 秒間隔の保存：`POST /api/progress` を実測で確認
- 開発サーバーでは断続的にプレイヤーが失敗する（**React StrictMode の二重マウント**と考えられる）。
  本番ビルドでは連続 3 回とも正常。加えて `onError` を自前の日本語表示へ接続済み

### Phase 6 — 受講権限・お知らせ・検索・マイページ（✅ 完了）

**目的**：受講権限で動画を保護し、お知らせ・検索・マイページを実データにする

**6-A / 6-B お知らせ**
- `announcements`（本文は jsonb で `AnnouncementBlock[]` をそのまま保持）/ `announcement_reads`
- 公開制御は `is_published` と `published_at` の 2 つ。予約公開も表現できる
- **配信は全体のみ。** ユーザー / コース単位は `target_course_id` を 1 列足して拡張する
- `date` と `isNew` は DB に持たず `published_at` から算出するため、**一覧・詳細・TOP の JSX は無変更**
- ヘッダーの赤い未読ドットは**常時点灯のハードコード**だったので実データに接続（PC / Mobile の 2 箇所）
- シードは**本文を持つ 1 件のみ**。本文の無い 7 件はダミー本文を作らず投入していない

**6-C 検索**
- **DB 検索は使わない。** 教材はすでに 1 リクエストで全件メモリに載っているため、
  この規模では `ilike` も索引も不要。スナップショットが RLS を通ってきているので
  受講権限とも自動的に整合する
- 対象：コース（タイトル / 説明 / カテゴリ）、動画（タイトル / 説明 / 学べること /
  **チャプター名** / コース名 / ツール名 / カテゴリ）
- **チャプターは単独の結果に出さない**（遷移先が中途半端になるため）
- `/search` を追加。既存の `CourseCard` / `VideoCard` を再利用
- PC ヘッダーの検索ボックスは**見た目だけのリンク**だったので本物の入力欄にした

**6-D マイページ**
- 表示名の編集・通知設定の ON/OFF を実装（**DB 変更なし**。`profiles` の列レベル権限で足りる）
- メールアドレスは表示のみ（変更には確認メールが要るため対象外）
- **「パスワード最終更新日」のダミー表示を撤去**（取得元が無く嘘の情報だった）
- 通知設定は保存できるが、**実際の送信は Custom SMTP を入れるまで動かない**

**6-E 受講権限（最重要）**
- **教材テーブルの RLS は変更していない。** 再生層で止める設計
  - コース一覧・詳細・カリキュラムは未受講でも見える（ロック表示）
  - `/watch/[lessonId]` の直打ちはサーバー側で拒否し、コース詳細へ戻す
  - 判定は**署名トークンを発行する前**。権限が無ければトークンは 1 度も生成されない
- 期限：`NULL` は無期限 / 未来は有効 / 過去は期限切れ / 壊れた値は期限切れ（安全側）
- `admin` は受講権限に関係なく全コース閲覧可
- **移行は「先に配ってから有効化」。** 既存ユーザー × 全公開コースへ付与済み（6 件・無期限）

**⚠️ 受講権限の運用（Phase 7 まで）**
新しく招待した受講生は**権限ゼロで始まる**ため、付与を忘れると「何も再生できない」問い合わせになる。
付与手順と確認クエリは `supabase/README.md` に記載した。

**検証結果**
- 自動テスト 30 → **56 件**（お知らせ 7 / 検索 10 / 受講権限 9 を追加）
- 受講権限の 4 パターン（無期限 / 期限内 / 期限切れ / 未受講）を**実データで実測**
  （ロールバックするトランザクション内で検証したため実データは無変更）
- `profiles.role` が受講生から更新できないことを SQL レベルで再実測

**6-F 総合 QA（実ブラウザ）**
- 全 12 ページが 200。Console エラーなし。PC 1440 / Mobile 390 とも横スクロールなし
- 未読管理をログで実測（未読 1 → 詳細を開く → 0）
- 未受講コースの `/watch` 直打ちを実測。**署名トークンが 1 度も発行されないこと**まで確認
- クライアントバンドル（ローカル / 本番の両方）を走査し、秘密情報の露出が 0 であることを確認
- `npm test` 56 / TypeScript 0 / ESLint 0 / 本番ビルド成功

**6-F で見つけて直した不具合 2 件**

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| ロックされたコース詳細の「次に見る動画」から `/watch` へ遷移でき、押すと同じページへ戻される | サーバー側では正しく拒否できていたが、**リンク自体が残っていた** | `ResumeLink` で未受講時はリンクを外す（サーバー判定はそのまま） |
| **Mobile 幅で本物のプレイヤーが一度もマウントされない** | `useIsDesktopLayout` が `useSyncExternalStore` 実装で、ハイドレーション後にクライアント値へ同期し直されなかった。ウィンドウをリサイズしたときだけ直っていた | マウント後に `requestAnimationFrame` で実際の幅を読んで反映する形へ変更 |

> **教訓（Phase 5 と同じ）**：プレビュー枠では再現しない不具合がある。
> 動画とレスポンシブは**必ず実ブラウザの実寸で**確認すること。

### Phase 7 — 管理画面・運用機能（🟡 実装完了 / 総合 QA 中）

**目的**：運営スタッフが Supabase / Cloudflare を開かずに日常業務を回せるようにする

設計の全文は `PHASE7_ADMIN_SPEC.md`。ここには実装の結果と、
**実際に踏んだ落とし穴**だけを残す。

**7-A/7-B 管理画面の土台と受講生一覧**
- `(admin)` は `(main)` と別 Route Group。受講生向けヘッダー・タブバー・
  ContentProvider を引きずらない
- 防御は 3 層（proxy → `requireAdmin()` → RLS）。守っているのは RLS
- **`auth.users` へは SECURITY DEFINER 関数で到達する。**
  View(`security_invoker = true`) は実測で `permission denied for table users`。
  `security_invoker = false` の View は PostgREST に auth.users を
  テーブルとして露出させるため採らない
- 関数の認可は「絞り込み」ではなく **例外**。where で 0 件にする書き方は
  条件を書き忘れた瞬間に全件漏れる
- 一覧の起点は `auth.users`。`profiles` は作成トリガーが失敗しても
  警告に留める設計なので、`profiles` 起点だと
  「Auth ユーザーは居るが一覧に出ない ＝ 復旧できない」状態が起こり得る

**7-C 受講権限**
- 受講期限は **JST のその日いっぱい**。00:00Z を入れると JST の午前 9 時に切れる
- 月数の加算も JST のカレンダーで行う（`setMonth` は UTC 基準でずれる）
- 監査ログの append-only は **RLS ではなく権限**で落とす。
  UPDATE / DELETE を grant しなければポリシーの有無に関係なく書き換えられない
- 監査ログの記録に失敗しても操作自体は失敗させない
  （状態を変えた後に例外を投げると、運営が二重に付与する）

**7-D 招待**
- Secret Key を使うのは **招待の 1 経路だけ**
- 招待とコース付与は必ず同じ操作にする。別作業にすると必ず付与漏れが起きる
- 招待は成功したが付与だけ失敗した場合、**成功として返して失敗したコースを名指しする**。
  まとめてエラーにすると運営が「招待もされていない」と誤解して 2 通目を送る
- 招待メールは `token_hash` 方式。別ブラウザで開いても成立する

**7-E/7-F Cloudflare**
- Direct Creator Upload。動画は Vercel を通らない
- **URL 発行時点で uid が確定する**ので、照合処理は存在しない
- Cloudflare は尺の「不明」を **-1** で返す。そのまま保存しない
- ready は `state` だけで判断せず `readyToStream` と `pctComplete` も見る
- 公開条件は CHECK ではなく Server Action で見る。
  CHECK にすると、公開中の動画が壊れたときに真実を記録できなくなる

**7-G/7-H お知らせとレッスン**
- 本文は `AnnouncementBlock[]` のまま。リッチテキストエディタは作らない
- 公開日時は JST で解釈する
- 並び替えは番号も振り直す。`sort_order` だけ入れ替えると番号が飛ぶ

---

## 6. Cloudflare Stream 構成

### 採用理由と方式

- 動画ファイルを Next.js / Supabase に直接大量保存しない方針のため **Cloudflare Stream** を採用
- Cloudflare 側で **Require Signed URLs を有効化済み**
- Cloudflare 公式が推奨する**署名キー方式**を採用
  （毎回 Stream API を叩く方式はレート制限があるため非推奨とされている）

### 署名の仕組み

```
JWT ヘッダ  : { alg: "RS256", kid: <署名キーID> }
JWT ペイロード: { sub: <Video UID>, kid: <署名キーID>, nbf: now-30, exp: now+7200 }
```

- **RS256** で署名。**Node 標準の `crypto` のみ**（追加ライブラリなし）
- 有効期限は既定 **2 時間**（Cloudflare の上限は 24 時間）
- `nbf` を 30 秒前倒しし、時計ずれによる即時失効を防止
- 署名キー（PEM）は base64 / 生 PEM のどちらの形式でも受け付ける

### 再生 URL

再生 URL のパス部分が **Video UID ではなくトークン**になる。

```
https://customer-<CODE>.cloudflarestream.com/<TOKEN>/iframe
https://customer-<CODE>.cloudflarestream.com/<TOKEN>/manifest/video.m3u8
https://customer-<CODE>.cloudflarestream.com/<TOKEN>/thumbnails/thumbnail.jpg
```

### サーバー側で生成する理由と保護

- 署名生成は `src/lib/stream/cloudflare.ts`（**`server-only`**）でのみ実行。
  クライアントバンドルへ混入した時点でビルドが失敗する
- `watch/[lessonId]/page.tsx` は **Server Component**。`requireUser()` を通った後にのみ署名を発行
- 未ログインは proxy が `/login` へリダイレクトするため、署名情報に到達できない
  → 実測で未ログインのレスポンス本文に `cloudflarestream` / JWT / customer コードが **0 件**であることを確認

### `stream_video_id` との関係（分岐仕様）

| 条件 | 挙動 |
|---|---|
| `stream_video_id` あり + 資格情報あり | Cloudflare 公式プレイヤーで**本物の動画**を再生 |
| `stream_video_id` が NULL | **Phase 1 由来のダミープレイヤー** |
| 資格情報が未設定（ローカル等） | `stream_video_id` の有無にかかわらず**全部ダミー**（安全側に倒れる） |
| 署名生成に失敗 | `kind: "error"` を返し、**ページ全体は壊さず**簡素なエラー表示 + 再読み込みボタン |

### プレイヤーへの受け渡し

```
watch/[lessonId]/page.tsx  (Server)
  └─ createPlaybackSource()  → PlaybackSource
      └─ WatchView  (Client)
          ├─ VideoPlayer        (PC)    → StreamStage or ダミー
          └─ MobileVideoPlayer  (Mobile) → StreamStage or ダミー
```

### PC / Mobile の構成

- **PC**：外枠・角丸・16:9 はダミーと同一。本物再生時は**ダミーのコントロールバーを描画しない**
  （操作できない偽のバーが残ると誤解を招くため）
- **Mobile**：本物再生時も**戻る「←」と「05 / 18」ピルを映像の上に重ねて維持**。
  Mobile の導線・下部固定の前後ナビは壊れていない

### 実測した検証結果

| 対象 | 結果 |
|---|---|
| 署名付き HLS マニフェスト | **HTTP 200** ✅ 受理 |
| 署名付き iframe | **HTTP 200** ✅ 受理 |
| **署名なし（生の Video UID）** | **HTTP 401** ✅ **拒否**（Require Signed URLs が機能） |

---

## 7. 環境変数

`furicari/.env.local` に設定する（**Git 管理対象外**）。
雛形は `furicari/.env.example` にある。

> **秘密情報の実値はこのファイルには一切記載しない。変数名のみ。**

### Supabase（必須）

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公開鍵（Supabase Dashboard の API Keys > Publishable key） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 旧仕様プロジェクト向けフォールバック（任意） |
| `NEXT_PUBLIC_SITE_URL` | 招待 / リセットメールのリダイレクト先 |

### Cloudflare Stream（本物の動画再生に必須）

| 変数名 | 用途 |
|---|---|
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | `customer-<CODE>.cloudflarestream.com` の `<CODE>` |
| `CLOUDFLARE_STREAM_SIGNING_KEY_ID` | 署名キーの ID |
| `CLOUDFLARE_STREAM_SIGNING_KEY_PEM` | 署名キーの秘密鍵（base64 または生 PEM） |

**この 3 つが揃わないと全レッスンがダミープレイヤーになる**（`readConfig()` で必須判定）。

### サーバー専用・将来用（現在未使用）

| 変数名 | 用途 |
|---|---|
| `SUPABASE_SECRET_KEY` | 管理者操作（Phase 7 の招待機能） |
| `SUPABASE_SERVICE_ROLE_KEY` | 上記の旧名フォールバック |
| `CLOUDFLARE_ACCOUNT_ID` | 署名キー再発行・動画アップロード |
| `CLOUDFLARE_STREAM_API_TOKEN` | 同上 |

### 自動付与（Vercel デプロイ時）

`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` / `NEXT_PUBLIC_VERCEL_URL`
（`getSiteUrl()` がフォールバックとして参照）

---

## 8. 現在のテスト動画

**`premiere-practice-05`（Premiere Pro 実践コース / Chapter 2 / 05 カット編集の基本を身につける）にのみ**、
Cloudflare Stream の Video UID を紐付けている。

- 紐付け SQL：`supabase/migrations/20260820100000_link_test_stream_video.sql`（冪等）
- **実測：全 90 本中、`stream_video_id` が入っているのは 1 本のみ。残り 89 本は NULL。**
- 隣接する `premiere-practice-06` を含む他レッスンは、
  **Phase 1 由来のダミープレイヤーを維持していることを PC / Mobile 両方で確認済み。**

> ⚠️ **全 90 本の一括紐付けはまだ行わない方針。**
> シード（`supabase/seed/0001_content.sql`）は `stream_video_id` を常に `null` で
> 生成するため、**シードを再実行するとこの紐付けが消える**。
> 再実行した場合は上記 migration を再度流すこと。

---

## 9. 現在の検証状況（Phase 4 終了時点）

実際に確認できたもののみ記載。

| 項目 | 結果 |
|---|---|
| TypeScript | ✅ エラー 0 |
| ESLint | ✅ エラー 0 / 警告 0 |
| 自動テスト | ✅ **13 / 13 通過** |
| Production Build | ✅ 成功 |
| Cloudflare 署名（署名付き） | ✅ HLS・iframe とも **HTTP 200** |
| Cloudflare 署名（署名なし） | ✅ **HTTP 401** で拒否 |
| 本物動画の再生（`premiere-practice-05`） | ✅ PC / Mobile 両方で表示 |
| ダミープレイヤー維持（`premiere-practice-06`） | ✅ PC / Mobile 両方で維持 |
| 16:9 | ✅ PC 756×425 / Mobile 390×219（**ともに 1.778**） |
| 横スクロール | ✅ PC・Mobile ともになし |
| Console エラー | ✅ アプリ由来なし（開発サーバーの HMR WebSocket 再接続のみ） |
| 秘密情報の非露出 | ✅ クライアントバンドル **405 ファイル全走査**で PEM / キー ID / 変数名すべて 0 件 |
| 未ログインでの署名情報到達 | ✅ 不可（レスポンス本文に 0 件） |
| `.env.local` の Git 追跡 | ✅ 未追跡 |

---

## 10. 重要な設計判断（なぜそうしたか）

### なぜ Cloudflare Stream を使うのか
動画ファイルを Next.js / Supabase に直接大量保存しない方針のため。
DB には Video UID とメタ情報だけを持ち、配信は Cloudflare が担う。

### なぜ Signed URL なのか
フリキャリは**受講料を払った受講生だけが視聴できる**べきサービス。
公開 URL だと URL を共有するだけで誰でも視聴できてしまう。
Require Signed URLs + 短時間トークンで、ログイン済み受講生のみに限定する。

### なぜ署名生成をサーバー側に限定するのか
署名キー（RSA 秘密鍵）がクライアントに渡ると、**誰でも任意の動画のトークンを無限に発行できる**。
`server-only` により、クライアントから参照された時点でビルドが失敗するようにしている。

### なぜ `stream_video_id` を Lesson に持たせるのか
「どの動画がどのレッスンか」は教材構造そのもの。
DB に持つことで、**管理画面から動画を差し替えてもコードを触らずに済む**。

### なぜ未設定 Lesson はダミーへフォールバックするのか
移行を**1 本ずつ安全に進める**ため。
全レッスンを Cloudflare 前提にすると、動画をアップロードするまで画面が壊れる。
資格情報が無いローカル環境でも開発が止まらない利点もある。

### なぜアプリ側の id が uuid ではなく slug なのか
Phase 1 の URL（`/courses/premiere-practice`, `/watch/premiere-practice-05`）を維持でき、
管理画面でも uuid を意識せず扱えるため。DB の主キーは uuid のまま。

### なぜ教材を「1 リクエスト 1 回だけ全件取得」するのか
コース 6 / チャプター 25 / レッスン 90 と件数が小さく、
ページごとに個別クエリを撃つより単純で N+1 も起きない。
React の `cache()` で同一リクエスト内は 1 回に集約される。

### なぜメールリンクが暗黙フロー（ハッシュ）なのか
**PKCE は「メールを申請したブラウザ」に code verifier が存在することを前提**にしており、
「PC で申請 → スマホでメールを開く」という**ごく普通の受講生の行動で必ず失敗する**
（`AuthPKCECodeVerifierMissingError`）。実際にこの不具合が発生し、原因特定のうえ切り替えた。
暗黙フローはステートレスなのでどの端末でも成立する。

> Custom SMTP を設定してメールテンプレートを編集できるようになれば、
> Supabase 公式推奨の `token_hash` 方式へ移行できる。
> 受け口は `/auth/confirm` に実装済みで、**テンプレートを書き換えるだけ**で切り替わる。

### なぜ進捗をダミーのまま残しているのか
Phase 3 は「教材の DB 化」がスコープ。進捗まで同時に触ると影響範囲が広がりすぎる。
境界を `src/lib/progress/dummy.ts` の 1 ファイルに閉じ、Phase 5 でそこだけ差し替える。

---

## 11. やってはいけないこと / 壊してはいけないもの

### 🚫 デザイン（Phase 1 の UI は FIX 済み）

- **Phase 1 の UI・レイアウト・余白・カードサイズ・角丸・配色・文字サイズ・
  ボタン・タグ・アイコン・進捗バー・ヘッダー・フッターを勝手に変更しない。**
- 新しい色 / 角丸 / 影 / フォントサイズを追加しない。
  トークンは `src/app/globals.css` の `@theme` にあるものだけを使う。
- デザインの正解は `../フリキャリ TOPページ PC版/`（リポジトリ外）。
  **原本を編集・削除しない。**

### ⚠️ 壊れやすい実装上の落とし穴（過去に実際に壊れた箇所）

| 箇所 | 注意 |
|---|---|
| `Header.tsx` の `hidden lg:block` | **Header 自身に付けること。** ラッパー div で囲むと sticky の可動域がヘッダー高さ分しかなくなり、スクロールで流れて消える（実際に発生した） |
| `globals.css` のベーススタイル | **必ず `@layer base` に入れる。** レイヤー外に書くと Tailwind の utilities より優先され、`text-white` 等が効かなくなる（ボタン文字が消えた） |
| `database.types.ts` | **`interface` ではなく `type` エイリアスで定義する。** interface は `Record<string, unknown>` 制約を満たさず supabase-js の型が `never` に壊れる |
| `src/lib/auth/actions.ts`（`"use server"`） | **非同期関数以外を export しない。** 定数は `src/lib/auth/state.ts` に分離済み |
| `src/proxy.ts` | Next.js 16 の Proxy。`middleware.ts` にリネームしない |
| `updateSession()` の戻り値 | `supabaseResponse` をそのまま返すこと。新しい `NextResponse` を作り直すとセッションが切れる |

### 🔐 セキュリティ

- `.env.local` を Git 管理対象にしない
- Secret Key / Signing Key / API Token をコードやクライアントへ露出させない
- `server-only` が付いているファイル（`stream/cloudflare.ts` / `supabase/admin.ts` /
  `auth/user.ts` / `content/server.ts` / `supabase/email-link.ts`）を
  Client Component から import しない
- RLS ポリシーを緩めない。特に `profiles.role` の保護

### 🗄️ データ

- **本番 Supabase のデータを破壊する操作をしない**
- `supabase/seed/0001_content.sql` を再実行すると `stream_video_id` が NULL に戻る（§8）
- `user_course_enrollments` を使った閲覧制御を**勝手に有効化しない**
  （現在のテストユーザーが既存コースを見られなくなる）
- `supabase/seed/0001_content.sql` を手編集しない（自動生成物。`npm run seed:generate` で再生成）

---

## 12. 未実装・今後の Phase

### Phase 7 — 管理機能（次にやるべきこと）

- `role = 'admin'` 向け管理画面（コース / チャプター / 動画 CRUD、並び替え、公開・非公開）
- Cloudflare Stream への動画アップロード（tus ダイレクトアップロード）
- 管理画面からの受講生招待（`src/lib/supabase/admin.ts` 経由で `inviteUserByEmail()`）
- **DB は変更不要**（`is_published` / `sort_order` / admin の RLS は実装済み）

### Phase 8 — テスト・セキュリティ・本番デプロイ

- Vercel デプロイ（**リポジトリルートが `furicari/` なので Root Directory の設定は不要**）
- 本番ドメインを Supabase の Site URL / Redirect URLs に追加
- Cloudflare の Allowed Origins を本番ドメインへ制限

### その他の残課題

| 優先度 | 内容 |
|---|---|
| **高** | **Custom SMTP の設定**。標準 SMTP は組織メンバー宛にしか送れず、受講生に招待メールを送れない |
| **高** | **`lessons.duration_seconds` を実際の動画の尺に合わせる。** 現在テスト動画は実尺 58 秒だが DB は 12:45。Phase 7 の動画アップロード時に Cloudflare API から実尺を取得して自動更新する方針で確定済み |
| **高** | **新規受講生への受講権限の付与。** Phase 6-E 以降、権限が無いと動画を再生できない。管理画面ができるまでは `supabase/README.md` の手順で SQL 付与する |
| 中 | プレイヤーデザインを Phase 1 に寄せる（HLS マニフェスト URL は発行済みなので着手可能） |
| 中 | 署名トークンの有効期限は 2 時間。タブを開いたまま放置すると再生に失敗する（`onError` で日本語表示に落として再読み込みを促してはいる） |
| 中 | 残り 89 本の動画アップロードと `stream_video_id` 紐付け |
| 低 | マイページの「パスワード最終更新日」は取得元が無くダミーのまま |
| 低 | ログインの「ログイン状態を保持」チェックは意匠のみ（Supabase のセッションは既定で永続） |
| 低 | RLS の他ユーザー分離はテストユーザーが 1 名のみのため、2 人目を招待するとより厳密に検証できる |

---

## 13. 次セッション開始時の手順

```bash
cd "/Users/user/Desktop/UNARI株式会社/AI/動画編集×AI講座/学習サイト/furicari"
```

1. **このファイル（`FURICARI_HANDOFF.md`）を最初に読む**
2. `git status` — 作業ツリーがクリーンか確認
3. `git log --oneline -5` — Phase 1〜4 のコミットがあるか確認
4. `git branch --show-current` — `main` であることを確認
5. `git fetch origin && git log --oneline origin/main..HEAD` — **未 Push のコミットを確認**
6. `.env.local` が存在するか確認（無ければ `.env.example` を元に依頼者へ値を要求。**値を推測しない**）
7. `npm run db:verify` — Supabase のテーブルが揃っているか確認
8. `npm run dev` で起動し、`http://localhost:3000/login` からログインして画面を確認
   （教材データは Supabase 由来。フォールバック警告がサーバーログに出ていないことを確認）
9. `npm test && npx tsc --noEmit && npx eslint src && npm run build` — 現状のグリーンを確認
10. **§12 の Phase 5 から着手する**。着手前に §11「やってはいけないこと」を必ず読む

---

## 付録：Git の状態（Phase 4 完了時点）

```
branch : main
origin : git@github.com:permil-g-y/furicari-lms.git

71aa130  Phase 4: Connect Cloudflare Stream test video   ← 未 Push
4c0945a  Phase 3: Migrate course content to Supabase     ← origin/main
a134b24  Phase 2: Implement Supabase authentication
115c25d  Phase 1: Complete UI implementation
33eec9a  Initial commit from Create Next App
```

**未 Push のコミットが 1 件ある。** 次セッションで Push するかどうかは依頼者に確認すること。
