/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Icon, Logo, SearchGlyph } from "@/components/ui/Icon";

export type PcNavKey = "home" | "courses" | "videos" | "favorites" | "news";

/** ヘッダーに出すログインユーザーの最小限の情報 */
export type HeaderUser = {
  displayName: string;
  avatarUrl: string | null;
};

const navItems: { key: PcNavKey; label: string; href: string }[] = [
  { key: "home", label: "ホーム", href: "/" },
  { key: "courses", label: "コース", href: "/courses" },
  { key: "videos", label: "動画一覧", href: "/videos" },
  { key: "favorites", label: "お気に入り", href: "/favorites" },
  { key: "news", label: "お知らせ", href: "/news" },
];

/**
 * PC ヘッダー（高さ 76px・sticky）
 *
 * PC/Mobile の出し分け（hidden lg:block）は必ずこの header 自身に付ける。
 * ラッパー div で囲むと sticky の可動域がヘッダーの高さ分しかなくなり、
 * スクロールした瞬間に流れて消えてしまう。
 */
export function Header({
  active,
  user,
}: {
  active?: PcNavKey | null;
  user: HeaderUser;
}) {
  return (
    <header className="sticky top-0 z-20 hidden border-b border-line bg-surface lg:block">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-10 px-10">
        <Link href="/" className="block leading-none">
          <Logo height={34} />
        </Link>

        <nav className="flex flex-1 items-center gap-1.5">
          {navItems.map((item) => {
            const on = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  on
                    ? "block rounded-full bg-brand-tint px-4 py-[9px] font-rounded text-15 font-bold text-brand-deep"
                    : "block rounded-full px-4 py-[9px] text-15 font-medium text-ink2 transition-colors hover:bg-brand-tint hover:text-brand-deep"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/videos"
            className="flex h-11 w-[220px] items-center gap-2.5 rounded-full border border-line bg-page px-4 transition-colors hover:border-brand-tint2"
          >
            <SearchGlyph size={15} />
            <span className="text-135 text-ink4">動画・コースを検索</span>
          </Link>

          <Link
            href="/news"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:bg-page"
          >
            <Icon name="icon-chat" size={22} alt="お知らせ" />
            <span className="absolute right-2.5 top-[9px] h-2 w-2 rounded-full border-2 border-white bg-alert" />
          </Link>

          <Link
            href="/mypage"
            className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-1.5 transition-colors hover:bg-page"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-tint">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="icon-user" size={20} />
              )}
            </span>
            <span className="max-w-[120px] truncate pr-2 text-135 font-medium text-ink-sub">
              {user.displayName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
