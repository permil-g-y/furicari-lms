import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "ログイン | フリキャリ" };

/**
 * ログイン画面。
 * デザインは Phase 1（Claude Design 準拠）のまま、認証だけ Supabase Auth に接続している。
 * フリキャリは招待制のため、一般ユーザー向けの新規登録導線は置かない。
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/";

  const initialMessage =
    params.error === "link_invalid"
      ? "リンクの有効期限が切れているか、無効です。お手数ですが、もう一度メールの送信をご依頼ください。"
      : undefined;

  return (
    <AuthShell>
      <LoginForm next={next} initialMessage={initialMessage} />
    </AuthShell>
  );
}
