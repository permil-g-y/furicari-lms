import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { getAuthUser } from "@/lib/auth/user";

export const metadata = { title: "新しいパスワードの設定 | フリキャリ" };

/**
 * パスワード再設定メールのリンクから来たユーザーが、新しいパスワードを設定する画面。
 * /auth/confirm でセッションが確立済みであることが前提。
 */
export default async function PasswordResetUpdatePage() {
  const user = await getAuthUser();

  if (!user) redirect("/password-reset?error=link_invalid");

  return (
    <AuthShell>
      <PasswordForm
        title="新しいパスワード"
        description="新しいパスワードを入力してください。設定するとそのままログインします。"
        submitLabel="パスワードを変更する"
        email={user.email}
      />
    </AuthShell>
  );
}
