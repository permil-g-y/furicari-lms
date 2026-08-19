import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { fallbackDisplayName, getAuthUser } from "@/lib/auth/user";

export const metadata = { title: "パスワードの設定 | フリキャリ" };

/**
 * 招待メールのリンクから来た受講生が、初回パスワードを設定する画面。
 * /auth/confirm でセッションが確立済みであることが前提。
 */
export default async function SetPasswordPage() {
  const user = await getAuthUser();

  // セッションが無い＝リンクが無効か期限切れ
  if (!user) redirect("/login?error=link_invalid");

  return (
    <AuthShell>
      <PasswordForm
        title="パスワードの設定"
        description="フリキャリへようこそ。ログインに使うパスワードを設定してください。"
        submitLabel="設定してはじめる"
        email={user.email}
        askDisplayName
        displayNamePlaceholder={fallbackDisplayName(user.email)}
      />
    </AuthShell>
  );
}
