"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon, Logo } from "@/components/ui/Icon";
import { currentUser } from "@/lib/mock";

/** 左カラム下部・Mobile 下部に置く専用ミニフッター */
function MiniFooter({ variant }: { variant: "pc" | "mobile" }) {
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState("furikyari2026");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  function handleSubmit(event: React.FormEvent) {
    // Phase 1 はダミー動作。認証は Phase 2 で Supabase Auth に接続する。
    event.preventDefault();
    router.push("/");
  }

  const fieldClass =
    "flex h-[52px] items-center gap-3 rounded-16 border border-line bg-surface-subtle px-4 focus-within:border-brand-tint2 lg:h-[54px] lg:px-[18px]";
  const labelClass = "text-125 font-bold text-ink-sub lg:text-13";
  const inputClass =
    "min-w-0 flex-1 bg-transparent text-14 text-ink-sub outline-none placeholder:text-ink4 lg:text-145";

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

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-1 flex-col gap-6 px-6 pt-2 pb-7 lg:my-auto lg:max-w-[400px] lg:flex-none lg:gap-8 lg:px-0 lg:py-0"
        >
          <Logo
            className="hidden self-start lg:block"
            style={{ height: "auto", width: 300 }}
          />

          <div className="flex flex-col gap-1.5 lg:gap-2">
            <h2 className="font-rounded text-20 font-bold text-ink lg:text-28">
              ログイン
            </h2>
            <p className="text-125 leading-[1.7] text-ink3 lg:text-14 lg:leading-[1.8]">
              登録済みのメールアドレスとパスワードを入力してください。
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:gap-5">
            <label className="flex flex-col gap-2 lg:gap-[9px]">
              <span className={labelClass}>メールアドレス</span>
              <span className={fieldClass}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="mail@example.com"
                  className={inputClass}
                />
              </span>
            </label>

            <label className="flex flex-col gap-2 lg:gap-[9px]">
              <span className={labelClass}>パスワード</span>
              <span className={fieldClass}>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="パスワード"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="shrink-0 cursor-pointer text-125 font-bold text-brand-deep hover:text-brand-deeper"
                >
                  {show ? "隠す" : "表示"}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-3 lg:gap-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-7 text-12 leading-none font-bold lg:text-13"
                  style={
                    remember
                      ? { background: "#3B90F5", color: "#fff" }
                      : {
                          background: "#fff",
                          border: "1.5px solid #D5E3F5",
                          color: "transparent",
                        }
                  }
                >
                  ✓
                </span>
                <span className="text-13 text-ink-sub lg:text-135">
                  ログイン状態を保持
                  <span className="hidden lg:inline">する</span>
                </span>
              </label>
              <Link href="#" className="text-125 text-brand-deep lg:text-13">
                パスワードを忘れた方
              </Link>
            </div>
          </div>

          <Button type="submit" size={56} block>
            ログイン
          </Button>
        </form>

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
