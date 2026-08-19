"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header, type PcNavKey } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar, type MobileTabKey } from "./MobileTabBar";

type ShellConfig = {
  /** PC ヘッダーでハイライトするナビ */
  pcNav: PcNavKey | null;
  /** Mobile ヘッダー。null なら表示しない（動画閲覧） */
  mobileHeader: { title?: string; back?: string } | null;
  /** Mobile タブバー。null なら表示しない（コース詳細・動画閲覧） */
  mobileTab: MobileTabKey | "none" | null;
};

/**
 * パスから共通レイアウトの構成を決める。
 * PC ナビのハイライトは Claude Design の active 指定をそのまま踏襲している
 * （学習履歴・マイページは Claude Design 上も active="home"）。
 */
function resolveShell(pathname: string): ShellConfig {
  if (pathname === "/") {
    return { pcNav: "home", mobileHeader: {}, mobileTab: "home" };
  }
  if (pathname === "/courses") {
    return {
      pcNav: "courses",
      mobileHeader: { title: "コース" },
      mobileTab: "courses",
    };
  }
  if (pathname.startsWith("/courses/")) {
    // Mobile はタブバーを出さず、ページ側の下部固定 CTA に導線を寄せる
    return {
      pcNav: "courses",
      mobileHeader: { title: "コース詳細", back: "/courses" },
      mobileTab: null,
    };
  }
  if (pathname === "/videos") {
    return {
      pcNav: "videos",
      mobileHeader: { title: "動画一覧" },
      mobileTab: "videos",
    };
  }
  if (pathname.startsWith("/watch/")) {
    // Mobile は没入レイアウト（ヘッダー・タブバーなし）
    return { pcNav: "courses", mobileHeader: null, mobileTab: null };
  }
  if (pathname === "/favorites") {
    return {
      pcNav: "favorites",
      mobileHeader: { title: "お気に入り" },
      mobileTab: "favorites",
    };
  }
  if (pathname === "/history") {
    return {
      pcNav: "home",
      mobileHeader: { title: "学習履歴", back: "/mypage" },
      mobileTab: "mypage",
    };
  }
  if (pathname === "/news") {
    return { pcNav: "news", mobileHeader: { title: "お知らせ" }, mobileTab: "none" };
  }
  if (pathname.startsWith("/news/")) {
    return {
      pcNav: "news",
      mobileHeader: { title: "お知らせ", back: "/news" },
      mobileTab: "none",
    };
  }
  if (pathname === "/mypage") {
    return {
      pcNav: "home",
      mobileHeader: { title: "マイページ" },
      mobileTab: "mypage",
    };
  }
  return { pcNav: null, mobileHeader: {}, mobileTab: "none" };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const config = resolveShell(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Header はラッパーで囲まない。sticky の可動域は親要素の高さで決まるため、
        ラッパー div（＝ヘッダーと同じ高さ）で囲むと固定されずに流れてしまう。
        PC/Mobile の出し分けは Header 側の hidden lg:block が持っている。
      */}
      <Header active={config.pcNav} />

      {config.mobileHeader && (
        <div className="lg:hidden">
          <MobileHeader {...config.mobileHeader} />
        </div>
      )}

      {/*
        タブバーがあるページは、最後のコンテンツが隠れない分だけ下余白を確保する。
        （タブバー実高 ≒ 83px + safe-area）
      */}
      <div
        className={`flex-1 ${config.mobileTab ? "pb-[96px] lg:pb-0" : ""}`}
      >
        {children}
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>

      {config.mobileTab && (
        <div className="lg:hidden">
          <MobileTabBar active={config.mobileTab} />
        </div>
      )}
    </div>
  );
}
