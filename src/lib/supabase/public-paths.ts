/**
 * ログイン不要で到達できるパス。これ以外は全てログイン必須として扱う。
 *
 * ■ なぜ proxy.ts から切り出しているのか
 *   ここを間違えると「本来守られるべき画面が公開される」か
 *   「機械用のエンドポイントが静かにログイン画面へ飛ばされる」かのどちらかになる。
 *   後者はレスポンスが 307 になるだけで例外も出ないため、気付けない。
 *   単体テストを書けるよう、Next.js に依存しない形で独立させている。
 */
const PUBLIC_PATHS = [
  "/login",
  "/password-reset",
  "/set-password",
  "/auth", // /auth/confirm などのコールバック
  /**
   * Vercel Cron が Cookie を持たずに叩く死活維持用エンドポイント。
   * ここを公開しないと proxy が /login へリダイレクトしてしまい、
   * Cron は 307 を受け取って「成功した」ように見えるのに
   * Supabase へは一切到達しない（= 自動停止を防げない）。
   * 認証は Route Handler 側の CRON_SECRET で行う。
   */
  "/api/keep-alive",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
