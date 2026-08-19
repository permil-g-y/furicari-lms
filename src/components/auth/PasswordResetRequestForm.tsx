"use client";

import Link from "next/link";
import { useActionState } from "react";
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
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/state";

/** パスワード再設定メールの送信フォーム */
export function PasswordResetRequestForm({
  initialMessage,
}: {
  initialMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );

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
        title="パスワードの再設定"
        description="ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。"
      />

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
      </div>

      <div className="flex flex-col gap-3.5">
        <Button type="submit" size={56} block>
          {pending ? "送信中..." : "再設定メールを送信"}
        </Button>
        <Link
          href="/login"
          className="text-center text-125 text-brand-deep hover:text-brand-deeper lg:text-13"
        >
          ログイン画面へ戻る
        </Link>
      </div>
    </form>
  );
}
