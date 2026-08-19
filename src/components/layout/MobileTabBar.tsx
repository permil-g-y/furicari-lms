import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type MobileTabKey =
  | "home"
  | "courses"
  | "videos"
  | "favorites"
  | "mypage";

const tabs: { key: MobileTabKey; label: string; icon: string; href: string }[] = [
  { key: "home", label: "ホーム", icon: "icon-cloud", href: "/" },
  { key: "courses", label: "コース", icon: "icon-book", href: "/courses" },
  { key: "videos", label: "動画", icon: "icon-film", href: "/videos" },
  { key: "favorites", label: "お気に入り", icon: "icon-heart", href: "/favorites" },
  { key: "mypage", label: "マイページ", icon: "icon-user", href: "/mypage" },
];

/**
 * Mobile ボトムタブバー。
 * Claude Design は width:390px 固定だが、本番はレスポンシブ化して全幅で敷く。
 * 下 22px の余白はホームインジケータ回避のためのもので、safe-area も加算する。
 */
export function MobileTabBar({ active }: { active?: MobileTabKey | "none" }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-line bg-white/97 px-2 pt-2 backdrop-blur-[8px]"
      style={{ paddingBottom: "calc(22px + env(safe-area-inset-bottom, 0px))" }}
    >
      {tabs.map((tab) => {
        const on = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] px-0.5 py-2 ${
              on ? "bg-brand-tint" : ""
            }`}
          >
            <Icon name={tab.icon} size={22} style={{ opacity: on ? 1 : 0.45 }} />
            <span
              className={`whitespace-nowrap text-105 leading-none ${
                on ? "font-bold text-brand-deep" : "text-ink4"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
