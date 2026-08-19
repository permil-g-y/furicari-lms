"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { currentUser } from "@/lib/mock";

/** アカウント設定のリスト（Claude Design の renderVals の 4 行） */
const settings = [
  {
    title: "プロフィール編集",
    desc: "表示名やアイコンを変更できます",
    value: currentUser.name,
  },
  {
    title: "メールアドレス",
    desc: "ログインと通知の受け取りに使用します",
    value: currentUser.email,
  },
  {
    title: "パスワード変更",
    desc: "定期的な変更をおすすめします",
    value: `最終更新 ${currentUser.passwordUpdatedAt}`,
  },
  {
    title: "通知設定",
    desc: "新着コース・お知らせのメール通知",
    value: currentUser.notificationEnabled ? "オン" : "オフ",
  },
];

export function AccountSettings() {
  const router = useRouter();

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {settings.map((row, i) => (
        <Link
          key={row.title}
          href="#"
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
          <span className="ml-auto hidden shrink-0 text-13 text-ink3 lg:block">
            {row.value}
          </span>
          <span className="shrink-0 text-14 text-brand-tint2">〉</span>
        </Link>
      ))}

      <div className="border-t border-surface-alt p-4 lg:px-6 lg:py-5">
        <Button
          variant="danger"
          size={46}
          onClick={() => router.push("/login")}
          className="w-full lg:w-auto"
        >
          ログアウト
        </Button>
      </div>
    </div>
  );
}
