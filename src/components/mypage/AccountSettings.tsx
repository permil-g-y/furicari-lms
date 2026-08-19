"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/auth/actions";
import { currentUser } from "@/lib/mock";

/**
 * アカウント設定のリスト（Claude Design の renderVals の 4 行）。
 *
 * 表示名・メールアドレス・通知設定は Supabase Auth / profiles の実データ。
 * パスワード最終更新日は取得できる値が無いため Phase 1 のダミーのまま。
 */
export function AccountSettings({
  displayName,
  email,
  notificationEnabled,
}: {
  displayName: string;
  email: string;
  notificationEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const settings = [
    {
      title: "プロフィール編集",
      desc: "表示名やアイコンを変更できます",
      value: displayName,
      href: "#",
    },
    {
      title: "メールアドレス",
      desc: "ログインと通知の受け取りに使用します",
      value: email,
      href: "#",
    },
    {
      title: "パスワード変更",
      desc: "定期的な変更をおすすめします",
      value: `最終更新 ${currentUser.passwordUpdatedAt}`,
      href: "/password-reset",
    },
    {
      title: "通知設定",
      desc: "新着コース・お知らせのメール通知",
      value: notificationEnabled ? "オン" : "オフ",
      href: "#",
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {settings.map((row, i) => (
        <Link
          key={row.title}
          href={row.href}
          className={`flex items-center gap-4 p-4 transition-colors hover:bg-surface-subtle lg:px-6 lg:py-[22px] ${
            i ? "border-t border-surface-alt" : ""
          }`}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-14 font-bold text-ink lg:text-15">
              {row.title}
            </span>
            <span className="text-12 text-ink4 lg:text-125">{row.desc}</span>
            <span className="truncate text-125 text-ink3 lg:hidden">
              {row.value}
            </span>
          </div>
          <span className="ml-auto hidden max-w-[280px] shrink-0 truncate text-13 text-ink3 lg:block">
            {row.value}
          </span>
          <span className="shrink-0 text-14 text-brand-tint2">〉</span>
        </Link>
      ))}

      <div className="border-t border-surface-alt p-4 lg:px-6 lg:py-5">
        <Button
          variant="danger"
          size={46}
          onClick={() => startTransition(() => void signOutAction())}
          className="w-full lg:w-auto"
        >
          {pending ? "ログアウト中..." : "ログアウト"}
        </Button>
      </div>
    </div>
  );
}
