"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Icon";
import {
  AuthHeading,
  FormMessage,
  authFieldClass,
  authFormClass,
  authInputClass,
  authLabelClass,
} from "./AuthShell";
import { signInAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/state";

export function LoginForm({
  next,
  initialMessage,
}: {
  next: string;
  initialMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  // useActionState の初期値はマウント時にしか反映されないため、
  // リンク切れ等でクライアント遷移してきたケースは props 側を優先して表示する。
  const message =
    state.status === "idle" && initialMessage
      ? { status: "error" as const, message: initialMessage }
      : state;

  return (
    <form action={formAction} className={authFormClass}>
      <Logo
        className="hidden self-start lg:block"
        style={{ height: "auto", width: 300 }}
      />

      <AuthHeading
        title="ログイン"
        description="登録済みのメールアドレスとパスワードを入力してください。"
      />

      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-4 lg:gap-5">
        <FormMessage status={message.status} message={message.message} />

        <label className="flex flex-col gap-2 lg:gap-[9px]">
          <span className={authLabelClass}>メールアドレス</span>
          <span className={authFieldClass}>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="mail@example.com"
              className={authInputClass}
            />
          </span>
        </label>

        <label className="flex flex-col gap-2 lg:gap-[9px]">
          <span className={authLabelClass}>パスワード</span>
          <span className={authFieldClass}>
            <input
              type={show ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              placeholder="パスワード"
              className={authInputClass}
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
          <Link
            href="/password-reset"
            className="text-125 text-brand-deep lg:text-13"
          >
            パスワードを忘れた方
          </Link>
        </div>
      </div>

      <Button type="submit" size={56} block>
        {pending ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}
