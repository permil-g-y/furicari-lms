# フリキャリ 学習サイト

「動画編集 × AI」を動画中心で学べるオンライン学習サイト **フリキャリ** の本番Webアプリ。

## Phase 1 の範囲

Claude Design で完成した UI を完全踏襲した Next.js レスポンシブアプリ。
**Supabase / 認証 / DB / Cloudflare Stream / 本番API は未接続**で、すべてモックデータで動作する。

## 技術構成

| 領域 | 採用 |
|---|---|
| Framework | Next.js 16（App Router） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4（`@theme` によるトークン定義） |
| 認証・DB | Supabase（Phase 2 以降） |
| 動画配信 | Cloudflare Stream（Phase 4 以降） |
| デプロイ | Vercel（Phase 8） |

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 で起動する。

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx              # フォント（Noto Sans JP / M PLUS Rounded 1c）と全体設定
│   ├── globals.css             # ★ デザイントークン（@theme）の唯一の定義場所
│   ├── (auth)/login/           # ログイン（Header/Footer/TabBar なし）
│   └── (main)/                 # 認証必須ゾーン（Phase 2 で middleware 保護を追加）
│       ├── layout.tsx          # AppShell + FavoritesProvider
│       ├── page.tsx            # TOP
│       ├── courses/            # コース一覧・コース詳細
│       ├── videos/             # 動画一覧
│       ├── watch/[lessonId]/   # 動画閲覧
│       ├── favorites/          # お気に入り
│       ├── history/            # 学習履歴
│       ├── news/               # お知らせ一覧・詳細
│       └── mypage/             # マイページ
├── components/
│   ├── layout/                 # Header / MobileHeader / MobileTabBar / Footer / AppShell
│   ├── ui/                     # Icon / Button / Tag / ProgressBar / Filters
│   ├── video/                  # VideoThumbnail / VideoCard / VideoPlayer
│   ├── course/ home/ news/ mypage/ history/
├── lib/
│   ├── types.ts                # ドメイン型（Supabase のテーブル設計と 1:1）
│   ├── favorites-context.tsx   # お気に入りの状態（Phase 5 で Supabase へ）
│   └── mock/                   # ★ ダミーデータの唯一の定義場所
│       ├── taxonomy.ts         # カテゴリ / ツール / 難易度 / フォーマッタ
│       ├── courses.ts          # コース・チャプター・レッスン
│       ├── user.ts             # ユーザー / 進捗 / お気に入り / 履歴 / お知らせ
│       └── index.ts            # セレクタ（Phase 3 で Supabase クエリへ置換する境界）
└── public/
    ├── logo.png
    ├── icons/                  # 正式アイコン 10 種（SVG / PNG）
    └── illust/                 # 正式イラスト 3 種
```

## デザインの正解（Reference）

**`../フリキャリ TOPページ PC版/` が唯一の正解**。Claude Design からダウンロードした原本で、
本番コードとは分離して保持している。**編集・削除しないこと。**

- PC 基準 1440px（コンテナ 1240px）／ Mobile 基準 390px
- レスポンシブの切り替え点は `lg`（1024px）
- 色・タイポ・余白・角丸・影はすべて `src/app/globals.css` の `@theme` に集約済み。
  **ページ内で新しい色や角丸を作らないこと。**

## モックデータ

`src/lib/mock/` が唯一の定義場所。Claude Design 内で各ページに重複定義されていた
ダミーデータ（特にカリキュラム 18 本）はここへ集約した。

Phase 3 では `src/lib/mock/index.ts` のセレクタ群を Supabase クエリへ差し替える。

## 今後の Phase

| Phase | 内容 |
|---|---|
| 1 ✅ | Claude Design 踏襲の UI 実装（ダミーデータ） |
| 2 | Supabase 導入・Auth（招待制。管理者がユーザー発行 → 招待メール → 初回パスワード設定） |
| 3 | Course / Chapter / Lesson の DB 化 |
| 4 | Cloudflare Stream 接続（署名付き URL / Token で受講生のみ再生可） |
| 5 | ユーザー別の学習進捗・履歴・お気に入り |
| 6 | 検索・フィルター・お知らせ・マイページの実データ化 |
| 7 | 管理機能 |
| 8 | テスト・セキュリティ・本番デプロイ |
