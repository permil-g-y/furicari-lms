/**
 * Supabase 接続情報の読み出し。
 *
 * Supabase は Publishable key（sb_publishable_...）へ移行中で、旧 anon key は
 * 2026 年末に非推奨になる。新旧どちらのプロジェクトでも動くよう、
 * Publishable key を優先し、無ければ anon key にフォールバックする。
 *
 * ここで扱うのは「公開してよい鍵」だけ。Secret key は admin.ts でのみ読む。
 */

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL が未設定です。.env.local を確認してください（.env.example がテンプレートです）。",
    );
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です。.env.local を確認してください（.env.example がテンプレートです）。",
    );
  }
  return key;
}

/**
 * 招待メール・パスワードリセットのリダイレクト先に使う自分自身の URL。
 * 環境変数が最優先。未設定なら Vercel の自動付与値、最後にローカルへフォールバック。
 * URL をコード内へ固定ハードコードしないための唯一の入口。
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
