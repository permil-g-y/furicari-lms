import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export const metadata = { title: "パスワードの再設定 | フリキャリ" };

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const initialMessage =
    params.error === "link_invalid"
      ? "リンクの有効期限が切れているか、無効です。お手数ですが、もう一度メールの送信をご依頼ください。"
      : undefined;

  return (
    <AuthShell>
      <PasswordResetRequestForm initialMessage={initialMessage} />
    </AuthShell>
  );
}
