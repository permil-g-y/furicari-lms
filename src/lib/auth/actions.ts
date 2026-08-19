"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEmailLinkClient } from "@/lib/supabase/email-link";
import { getSiteUrl } from "@/lib/supabase/env";
import type { AuthActionState } from "./state";

/** Supabase のエラーメッセージを受講生向けの日本語に置き換える */
function toJapaneseAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (normalized.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。招待メールのリンクから設定を完了してください。";
  }
  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "試行回数が多すぎます。しばらく時間をおいてからもう一度お試しください。";
  }
  if (normalized.includes("token has expired") || normalized.includes("expired")) {
    return "リンクの有効期限が切れています。お手数ですが、もう一度メールの送信をご依頼ください。";
  }
  if (normalized.includes("same password")) {
    return "現在と同じパスワードは設定できません。別のパスワードを入力してください。";
  }
  if (normalized.includes("password should be at least")) {
    return "パスワードは 8 文字以上で設定してください。";
  }
  return "処理に失敗しました。時間をおいてもう一度お試しください。";
}

/* ------------------------------------------------------------------ *
 * ログイン
 * ------------------------------------------------------------------ */
export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/";

  if (!email || !password) {
    return { status: "error", message: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: toJapaneseAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  // オープンリダイレクト防止のため、自サイト内の相対パスのみ許可する
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

/* ------------------------------------------------------------------ *
 * ログアウト
 * ------------------------------------------------------------------ */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/* ------------------------------------------------------------------ *
 * パスワードリセットメールの送信
 * ------------------------------------------------------------------ */
export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "メールアドレスを入力してください。" };
  }

  // メールリンクは別ブラウザ・別端末で開かれることがあるため、
  // code verifier に依存しない暗黙フローのクライアントで送る（email-link.ts 参照）。
  // 戻り先は公開ページにしておき、ハッシュを AuthHashHandler が受けて
  // /password-reset/update へ送る。
  const supabase = createEmailLinkClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/password-reset`,
  });

  if (error) {
    return { status: "error", message: toJapaneseAuthError(error.message) };
  }

  // 登録の有無を外部から判別できないよう、常に同じ文面を返す
  return {
    status: "success",
    message:
      "パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。",
  };
}

/* ------------------------------------------------------------------ *
 * パスワードの設定（招待後の初回設定 / リセット後の再設定で共用）
 * ------------------------------------------------------------------ */
export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (password.length < 8) {
    return { status: "error", message: "パスワードは 8 文字以上で設定してください。" };
  }
  if (password !== confirmation) {
    return { status: "error", message: "パスワードが一致しません。もう一度入力してください。" };
  }

  const supabase = await createClient();

  // 招待リンク / リセットリンクで確立されたセッションが必要
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      status: "error",
      message:
        "リンクの有効期限が切れているか、無効です。お手数ですが、もう一度メールの送信をご依頼ください。",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: toJapaneseAuthError(error.message) };
  }

  // 初回設定時に表示名も受け取れるようにしておく（任意入力）
  if (displayName) {
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", claims.claims.sub);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
