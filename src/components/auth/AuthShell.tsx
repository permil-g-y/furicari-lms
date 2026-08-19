/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Icon, Logo } from "@/components/ui/Icon";

/**
 * 認証画面（ログイン / 初回パスワード設定 / パスワード再設定）の共通シェル。
 *
 * Claude Design のログイン画面をそのまま切り出したもので、
 * 新しいデザインルールは一切足していない。
 * 追加の認証画面もここを通すことで Design System から外れないようにする。
 */

/** フォーム本体に付けるクラス（Claude Design のログインフォームと同一） */
export const authFormClass =
  "flex w-full flex-1 flex-col gap-6 px-6 pt-2 pb-7 lg:my-auto lg:max-w-[400px] lg:flex-none lg:gap-8 lg:px-0 lg:py-0";

/** 入力欄の枠（h52 / radius16 / #F8FBFF） */
export const authFieldClass =
  "flex h-[52px] items-center gap-3 rounded-16 border border-line bg-surface-subtle px-4 focus-within:border-brand-tint2 lg:h-[54px] lg:px-[18px]";

export const authLabelClass = "text-125 font-bold text-ink-sub lg:text-13";

export const authInputClass =
  "min-w-0 flex-1 bg-transparent text-14 text-ink-sub outline-none placeholder:text-ink4 lg:text-145";

/** 左カラム下部・Mobile 下部に置く専用ミニフッター */
export function MiniFooter({ variant }: { variant: "pc" | "mobile" }) {
  const links = (
    <>
      <Link href="#" className="text-12 text-ink3 hover:text-brand-deep">
        利用規約
      </Link>
      <span className="text-11 text-line-strong2">｜</span>
      <Link href="#" className="text-12 text-ink3 hover:text-brand-deep">
        プライバシーポリシー
      </Link>
    </>
  );

  if (variant === "mobile") {
    return (
      <footer className="mt-auto flex flex-col items-center gap-2.5 border-t border-surface-alt px-6 pt-6 pb-8 lg:hidden">
        <span className="text-12 text-ink3">株式会社〇〇</span>
        <div className="flex items-center gap-2.5">{links}</div>
        <span className="text-11 text-ink4">© 2026 フリキャリ</span>
      </footer>
    );
  }

  return (
    <footer className="hidden w-full max-w-[400px] flex-wrap items-center justify-center gap-3 border-t border-surface-alt pt-5 lg:flex">
      <span className="text-12 text-ink3">株式会社〇〇</span>
      <span className="text-11 text-[#DCE6F3]">/</span>
      {links}
      <span className="text-11 text-[#DCE6F3]">/</span>
      <span className="text-115 text-ink4">© 2026 フリキャリ</span>
    </footer>
  );
}

/**
 * 認証画面の 2 カラムレイアウト。
 * children にはフォーム（authFormClass を付けた form 要素）を渡す。
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-2">
      {/* ------------------------------------------------------------- 左 */}
      <div className="flex min-h-screen flex-col bg-surface lg:items-center lg:px-18 lg:pt-14 lg:pb-7">
        {/* Mobile のブランドヘッダー */}
        <div
          className="flex flex-col items-center gap-3.5 px-6 pt-9 pb-5 text-center lg:hidden"
          style={{ background: "linear-gradient(180deg,#EAF4FF 0%,#FFFFFF 100%)" }}
        >
          <Logo style={{ height: "auto", width: 180 }} />
          <h1 className="text-pretty font-rounded text-19 leading-[1.7] font-bold text-ink">
            動画編集 × AIを、楽しく学んで、
            <br />
            未来の自分に投資しよう。
          </h1>
          <img
            src="/illust/illust-girl.png"
            alt=""
            className="block h-auto w-[190px]"
          />
        </div>

        {children}

        <MiniFooter variant="mobile" />
        <MiniFooter variant="pc" />
      </div>

      {/* ------------------------------------------------------ 右（PC のみ） */}
      <div
        className="hidden items-center justify-center px-18 py-16 lg:flex"
        style={{ background: "linear-gradient(180deg,#EAF4FF 0%,#F7FBFF 70%)" }}
      >
        <div className="flex w-full max-w-[440px] flex-col items-start gap-7">
          <div className="flex items-center gap-2.5">
            <Icon name="icon-sparkle-duo" size={22} />
            <span className="text-13 font-bold tracking-[.04em] text-brand-deep">
              動画編集 × AI 学習サービス
            </span>
          </div>
          <h2 className="text-pretty font-rounded text-30 leading-[1.65] font-bold text-ink">
            動画編集 × AIを、
            <br />
            楽しく学んで、
            <br />
            未来の自分に投資しよう。
          </h2>
          <img
            src="/illust/illust-girl.png"
            alt=""
            className="block h-auto w-[320px] self-center"
          />
        </div>
      </div>
    </div>
  );
}

/** 認証画面の見出し（Claude Design のログイン見出しと同一） */
export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 lg:gap-2">
      <h2 className="font-rounded text-20 font-bold text-ink lg:text-28">{title}</h2>
      <p className="text-125 leading-[1.7] text-ink3 lg:text-14 lg:leading-[1.8]">
        {description}
      </p>
    </div>
  );
}

/**
 * エラー / 完了メッセージ。
 * 既存トークン（danger 系・success 系）だけで組んでおり、新しい色は使っていない。
 */
export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message: string;
}) {
  if (status === "idle" || !message) return null;

  const isError = status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`rounded-12 border px-4 py-3 text-125 leading-[1.7] ${
        isError
          ? "border-danger-line bg-pink-bg text-danger"
          : "border-success-line bg-success-bg text-success"
      }`}
    >
      {message}
    </p>
  );
}
