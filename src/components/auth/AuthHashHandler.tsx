"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * URL のハッシュ（#access_token=...）で返ってくる認証トークンを処理する。
 *
 * 招待メール（管理画面 / 管理 API 由来）は PKCE の検証子を持たないため、
 * Supabase は暗黙フローでトークンを **ハッシュ** に載せて返す。
 * ハッシュはサーバーへ送信されないので、サーバー側のルートハンドラでは受け取れない。
 * そのためブラウザ側で拾ってセッションを確立する必要がある。
 *
 * ルートレイアウトに常駐させているので、リンクの着地点が
 * `/`・`/login`・その他のどれであっても動作する
 * （ハッシュはリダイレクトを跨いでも保持されるため）。
 *
 * ハッシュが無いページでは何もしない。
 */
export function AuthHashHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");
    const errorCode = params.get("error_code") ?? params.get("error");

    if (!accessToken && !errorCode) return;

    handled.current = true;

    /** トークンを履歴に残さないようハッシュを消す */
    const clearHash = () => {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    };

    // リンク切れ・期限切れ
    if (errorCode || !accessToken || !refreshToken) {
      clearHash();
      router.replace(
        type === "recovery"
          ? "/password-reset?error=link_invalid"
          : "/login?error=link_invalid",
      );
      return;
    }

    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      clearHash();

      if (error) {
        router.replace(
          type === "recovery"
            ? "/password-reset?error=link_invalid"
            : "/login?error=link_invalid",
        );
        return;
      }

      // 招待 → 初回パスワード設定 / リセット → 新しいパスワード設定
      router.replace(
        type === "recovery" ? "/password-reset/update" : "/set-password",
      );
      // サーバー側に新しい Cookie を認識させる
      router.refresh();
    })();
  }, [router]);

  return null;
}
