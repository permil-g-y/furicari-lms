import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * 招待メール / パスワードリセットメールのリンク先。
 *
 * Supabase から戻ってくる形式は 2 通りあるため、両方に対応する。
 *   1. token_hash + type … メールテンプレートで {{ .TokenHash }} を使う推奨方式
 *   2. code             … PKCE フローのコールバック
 *
 * 検証に成功するとセッションが確立され、`next` のページへ遷移する。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as EmailOtpType | null;

  // 遷移先はリンク種別から決める（明示指定があればそれを優先）
  const requestedNext = searchParams.get("next");
  const defaultNext = type === "recovery" ? "/password-reset/update" : "/set-password";
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : defaultNext;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    return NextResponse.redirect(new URL(errorPath(type), origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    // 失敗理由をサーバー側に残す（トークン本体は出力しない）
    console.error(
      "[auth/confirm] exchangeCodeForSession failed:",
      JSON.stringify({
        message: error.message,
        name: error.name,
        status: error.status,
        code: error.code,
        type,
        hasFlowIdParam: searchParams.has("sb_flow_id"),
        verifierCookies: request.cookies
          .getAll()
          .map((c) => c.name)
          .filter((n) => n.includes("code-verifier")),
      }),
    );
    return NextResponse.redirect(new URL(errorPath(type), origin));
  }

  return NextResponse.redirect(new URL(errorPath(type), origin));
}

/** 検証に失敗したときの戻り先。リンク種別に応じて再送導線のあるページへ返す */
function errorPath(type: EmailOtpType | null): string {
  if (type === "recovery") {
    return "/password-reset?error=link_invalid";
  }
  return "/login?error=link_invalid";
}
