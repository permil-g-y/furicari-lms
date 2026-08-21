"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 管理画面のサイドナビ。
 *
 * 受講生向けの Header / MobileTabBar は使わない。
 * 同じヘッダーを共有すると、受講生向けの導線（お気に入り・お知らせの未読ドットなど）が
 * 管理業務の邪魔になるうえ、片方の変更がもう片方を壊すため。
 */
const items: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/admin", label: "ダッシュボード", match: (p) => p === "/admin" },
  {
    href: "/admin/students",
    label: "受講生",
    match: (p) => p.startsWith("/admin/students"),
  },
  {
    href: "/admin/lessons",
    label: "レッスン",
    match: (p) => p.startsWith("/admin/lessons"),
  },
  {
    href: "/admin/announcements",
    label: "お知らせ",
    match: (p) => p.startsWith("/admin/announcements"),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
      {items.map((item) => {
        const on = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              on
                ? "block whitespace-nowrap rounded-xl bg-brand-tint px-4 py-2.5 font-rounded text-14 font-bold text-brand-deep"
                : "block whitespace-nowrap rounded-xl px-4 py-2.5 text-14 font-medium text-ink2 transition-colors hover:bg-brand-tint hover:text-brand-deep"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
