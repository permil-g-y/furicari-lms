/**
 * 認証ゾーンのレイアウト。
 * ログインは Header / Footer / MobileTabBar を持たない独立画面のため、
 * AppShell を通さずそのまま描画する。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
