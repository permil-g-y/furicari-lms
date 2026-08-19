import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * 認証メール（パスワード再設定など）の送信専用クライアント。
 *
 * ■ なぜ通常の server.ts と分けているか
 *
 * @supabase/ssr の createServerClient は flowType を "pkce" に固定している
 * （利用側の指定より後に上書きされるため変更できない）。
 *
 * PKCE は「メールを申請したブラウザ」に保存した code verifier が
 * 「リンクを開いたブラウザ」にも存在することを前提にした方式で、
 * OAuth のように申請と完了が同一ブラウザで完結する場合にのみ成立する。
 *
 * ところがパスワード再設定では
 *   「PC で申請 → スマホでメールを開く」
 *   「PC で申請 → 別のブラウザでメールを開く」
 * が普通に起きるため、その場合 verifier が見つからず
 * AuthPKCECodeVerifierMissingError で必ず失敗する。
 *
 * そこでメールリンクについては暗黙フロー（implicit）を使う。
 * トークンが URL のハッシュで返るステートレスな方式で、
 * どのブラウザ・どの端末で開いても成立する。
 * 受け取りは AuthHashHandler が担当しており、
 * 管理画面からの招待メールで既に実績のある経路と同一になる。
 *
 * ■ 将来
 *
 * Custom SMTP を設定してメールテンプレートを編集できるようになったら、
 * Supabase 公式推奨の token_hash 方式
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=...
 * へ移行できる。受け口は /auth/confirm に実装済みで、
 * その場合この暗黙フローは不要になる。
 */
export function createEmailLinkClient() {
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: {
        // メールリンクをどのブラウザで開いても成立させる
        flowType: "implicit",
        // 送信するだけなのでサーバー側にセッションを持たない
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
