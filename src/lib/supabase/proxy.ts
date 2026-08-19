import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * 認証が不要なパス。これ以外は全てログイン必須として扱う。
 * （Next.js 16 では middleware が proxy へリネームされている）
 */
const PUBLIC_PATHS = [
  "/login",
  "/password-reset",
  "/set-password",
  "/auth", // /auth/confirm などのコールバック
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Cookie ベースのセッションを更新しつつ、認証状態に応じてリダイレクトする。
 *
 * - 未ログインで認証必須ページ  → /login
 * - ログイン済みで /login       → /
 *
 * Server Component は Cookie を書けないため、トークンのリフレッシュは
 * 必ずここ（proxy）で行う必要がある。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getSession() はサーバー側で信用してはいけない。
  // getClaims() は JWT の署名を検証したうえでクレームを返す。
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // ログイン後に元のページへ戻すためのヒント
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // supabaseResponse をそのまま返すこと。
  // 新しい NextResponse を作り直すと、更新後の Cookie が失われてセッションが切れる。
  return supabaseResponse;
}
