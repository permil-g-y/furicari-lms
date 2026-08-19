import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 の Proxy（旧 middleware）。
 * 全リクエストで Supabase のセッションを更新し、Protected Route を保護する。
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 静的アセットと画像最適化を除く全パスにマッチさせる。
     * - _next/static, _next/image, favicon.ico
     * - 画像・フォント等の拡張子
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf)$).*)",
  ],
};
